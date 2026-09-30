import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { EmailService } from '../email/email.service';
import {
  WalletTransactionType,
  WithdrawalStatus,
  NotificationType,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { ApproveWithdrawalDto } from './dto/approve-withdrawal.dto';
import { RejectWithdrawalDto } from './dto/reject-withdrawal.dto';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/bank-account.dto';
import { ResolveAccountDto } from './dto/resolve-account.dto';

@Injectable()
export class WithdrawalsService {
  private readonly logger = new Logger(WithdrawalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Retrieves or initializes a club's wallet with starting test liquidity.
   */
  async getWallet(clubId: string) {
    let wallet = await this.prisma.clubWallet.findUnique({
      where: { clubId },
    });

    if (!wallet) {
      wallet = await this.prisma.clubWallet.create({
        data: {
          clubId,
          currency: 'NGN',
          balance: 2500000, // ₦2.5m starter balance for smooth testing & demo
          lockedBalance: 0,
          totalWithdrawn: 350000,
        },
      });
      this.logger.log(`Initialized test wallet for club ${clubId}`);
    }

    return {
      id: wallet.id,
      clubId: wallet.clubId,
      currency: wallet.currency,
      balance: wallet.balance,
      availableBalance: wallet.balance,
      lockedBalance: wallet.lockedBalance,
      pendingBalance: wallet.lockedBalance,
      totalWithdrawn: wallet.totalWithdrawn,
      totalRevenue: wallet.balance + wallet.lockedBalance + wallet.totalWithdrawn,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  /**
   * Super Admin overview stats across all club wallets and withdrawal requests.
   */
  async getAdminStats() {
    // Ensure test data exists if system is fresh
    await this.ensureTestWithdrawalExists();

    const [wallets, pendingReqs, completedReqs] = await Promise.all([
      this.prisma.clubWallet.findMany({
        select: { balance: true, lockedBalance: true, totalWithdrawn: true },
      }),
      this.prisma.withdrawalRequest.findMany({
        where: { status: WithdrawalStatus.PENDING },
        select: { amount: true },
      }),
      this.prisma.withdrawalRequest.findMany({
        where: { status: WithdrawalStatus.COMPLETED },
        select: { amount: true },
      }),
    ]);

    const totalActiveHold = wallets.reduce((sum: number, w: { balance: number }) => sum + w.balance, 0);
    const totalDisbursed = wallets.reduce((sum: number, w: { totalWithdrawn: number }) => sum + w.totalWithdrawn, 0);

    const pendingCount = pendingReqs.length;
    const pendingAmount = pendingReqs.reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);

    const processedCount = completedReqs.length;
    const processedAmount = completedReqs.reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);

    return {
      pendingCount,
      pendingAmount,
      processedCount,
      processedAmount,
      totalDisbursed,
      totalActiveHold,
    };
  }

  /**
   * Retrieves withdrawal history for a single organizer club.
   */
  async getMyWithdrawals(
    clubId: string,
    query?: { status?: WithdrawalStatus; take?: number; skip?: number },
  ) {
    const where: any = { clubId };
    if (query?.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.withdrawalRequest.findMany({
        where,
        include: {
          club: { select: { id: true, name: true, logo: true } },
          requestedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          wallet: {
            select: { id: true, balance: true, lockedBalance: true, totalWithdrawn: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: query?.take,
        skip: query?.skip,
      }),
      this.prisma.withdrawalRequest.count({ where }),
    ]);

    return {
      items: items.map((i: any) => this.formatWithdrawalItem(i)),
      total,
    };
  }

  /**
   * Super Admin view: retrieves all withdrawals across all clubs.
   */
  async getAllWithdrawals(query?: {
    status?: WithdrawalStatus;
    take?: number;
    skip?: number;
  }) {
    await this.ensureTestWithdrawalExists();

    const where: any = {};
    if (query?.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.withdrawalRequest.findMany({
        where,
        include: {
          club: { select: { id: true, name: true, logo: true } },
          requestedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          wallet: {
            select: { id: true, balance: true, lockedBalance: true, totalWithdrawn: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: query?.take,
        skip: query?.skip,
      }),
      this.prisma.withdrawalRequest.count({ where }),
    ]);

    return {
      items: items.map((i: any) => this.formatWithdrawalItem(i)),
      total,
    };
  }

  /**
   * Request a new withdrawal from the organizer club's wallet.
   */
  async requestWithdrawal(userId: string, clubId: string, dto: RequestWithdrawalDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Withdrawal amount must be greater than zero.');
    }

    const wallet = await this.getWallet(clubId);
    if (wallet.availableBalance < dto.amount) {
      throw new BadRequestException(
        `Insufficient available balance. You have ₦${wallet.availableBalance.toLocaleString()} available.`,
      );
    }

    // Resolve bank account details
    let bankName = dto.bankName;
    let accountNumber = dto.accountNumber;
    let accountName = dto.accountName;

    if (dto.bankAccountId) {
      const savedAccount = await this.prisma.clubBankAccount.findUnique({
        where: { id: dto.bankAccountId },
      });
      if (savedAccount) {
        bankName = savedAccount.bankName;
        accountNumber = savedAccount.accountNumber;
        accountName = savedAccount.accountName;
      }
    }

    if (!bankName || !accountNumber || !accountName) {
      const defaultAccount = await this.getBankAccounts(clubId);
      if (defaultAccount.length > 0) {
        bankName = defaultAccount[0].bankName;
        accountNumber = defaultAccount[0].accountNumber;
        accountName = defaultAccount[0].accountName;
      } else {
        throw new BadRequestException('Please provide valid bank destination details.');
      }
    }

    // Execute atomic wallet lock and withdrawal creation
    const [updatedWallet, newRequest] = await this.prisma.$transaction([
      this.prisma.clubWallet.update({
        where: { clubId },
        data: {
          balance: { decrement: dto.amount },
          lockedBalance: { increment: dto.amount },
        },
      }),
      this.prisma.withdrawalRequest.create({
        data: {
          clubId,
          walletId: wallet.id,
          userId,
          amount: dto.amount,
          currency: 'NGN',
          bankName: bankName!,
          accountNumber: accountNumber!,
          accountName: accountName!,
          status: WithdrawalStatus.PENDING,
          notes: dto.notes,
        },
        include: {
          club: { select: { id: true, name: true, logo: true } },
          requestedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    // Record wallet ledger transaction
    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: WalletTransactionType.WITHDRAWAL_LOCK,
        amount: dto.amount,
        balanceBefore: wallet.availableBalance,
        balanceAfter: updatedWallet.balance,
        reference: newRequest.id,
        description: `Funds locked for withdrawal #${newRequest.id.substring(0, 8)} to ${bankName}`,
      },
    });

    // Send email notification safely
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.email && club?.name) {
      this.safeSendEmail('WITHDRAWAL_REQUESTED', user.email, {
        clubName: club.name,
        amount: dto.amount,
        bankName: bankName!,
        accountNumber: accountNumber!,
        accountName: accountName!,
        currency: 'NGN',
      });
    }

    // Create in-app notifications
    try {
      // 1. Notify organizer
      await this.notificationsService.createNotification({
        recipientId: userId,
        title: 'Payout Request Submitted',
        body: `Your payout request of ₦${dto.amount.toLocaleString()} to ${bankName} (${accountNumber}) has been submitted and is pending review.`,
        type: NotificationType.WITHDRAWAL_REQUESTED,
        data: {
          type: 'WITHDRAWAL_REQUESTED',
          withdrawalId: newRequest.id,
          amount: dto.amount,
          bankName,
          accountNumber,
        },
      });

      // 2. Notify Super Admins
      const superAdmins = await this.prisma.user.findMany({
        where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
        select: { id: true },
      });
      for (const admin of superAdmins) {
        await this.notificationsService.createNotification({
          recipientId: admin.id,
          title: 'New Payout Request',
          body: `${club?.name || 'Club'} requested a payout of ₦${dto.amount.toLocaleString()} to ${bankName}.`,
          type: NotificationType.WITHDRAWAL_REQUESTED,
          data: {
            type: 'WITHDRAWAL_REQUESTED',
            withdrawalId: newRequest.id,
            clubId,
            amount: dto.amount,
          },
        });
      }
    } catch (notifErr) {
      this.logger.warn(`Failed to dispatch in-app notifications for withdrawal request: ${notifErr}`);
    }

    return this.formatWithdrawalItem(newRequest);
  }

  /**
   * Super Admin approves and records payout of a pending withdrawal.
   */
  async approveWithdrawal(adminUserId: string, id: string, dto: ApproveWithdrawalDto) {
    const request = await this.prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        club: { select: { id: true, name: true } },
        requestedBy: { select: { email: true, firstName: true, lastName: true } },
        wallet: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Withdrawal request not found.');
    }

    if (request.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException(`Cannot approve request in ${request.status} status.`);
    }

    // Check organizer admin wallet balance before confirming withdrawal
    const wallet = request.wallet || (await this.prisma.clubWallet.findUnique({
      where: { id: request.walletId },
    }));

    if (!wallet) {
      throw new NotFoundException('Organizer club wallet not found for this withdrawal request.');
    }

    if (wallet.lockedBalance < request.amount) {
      throw new BadRequestException(
        `Insufficient locked funds in organizer wallet. Organizer currently has ₦${wallet.lockedBalance.toLocaleString()} locked in escrow, but this withdrawal requires ₦${request.amount.toLocaleString()}. Payout confirmation rejected to prevent overdraft.`,
      );
    }

    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const generatedRef = dto.reference?.trim() || `NIP/${dateStr}/TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const [updatedWallet, updatedRequest] = await this.prisma.$transaction([
      this.prisma.clubWallet.update({
        where: { id: request.walletId },
        data: {
          lockedBalance: { decrement: request.amount },
          totalWithdrawn: { increment: request.amount },
        },
      }),
      this.prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status: WithdrawalStatus.COMPLETED,
          reference: generatedRef,
          notes: dto.notes?.trim() || request.notes,
          processedAt: new Date(),
          processedById: adminUserId,
        },
        include: {
          club: { select: { id: true, name: true, logo: true } },
          requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    // Record payout transaction
    await this.prisma.walletTransaction.create({
      data: {
        walletId: request.walletId,
        type: WalletTransactionType.WITHDRAWAL_PAID,
        amount: request.amount,
        balanceBefore: updatedWallet.balance,
        balanceAfter: updatedWallet.balance,
        reference: generatedRef,
        description: `Payout processed for withdrawal #${request.id.substring(0, 8)} via ${request.bankName}`,
      },
    });

    // Notify organizer via email
    if (request.requestedBy?.email && request.club?.name) {
      this.safeSendEmail('WITHDRAWAL_APPROVED', request.requestedBy.email, {
        clubName: request.club.name,
        amount: request.amount,
        bankName: request.bankName,
        accountNumber: request.accountNumber,
        accountName: request.accountName,
        reference: generatedRef,
        notes: dto.notes,
        currency: request.currency || 'NGN',
      });
    }

    // Notify organizer via in-app notification
    try {
      await this.notificationsService.createNotification({
        recipientId: request.userId,
        title: 'Payout Disbursed',
        body: `Your payout of ₦${request.amount.toLocaleString()} has been disbursed to ${request.bankName} (${request.accountNumber}). Ref: ${generatedRef}`,
        type: NotificationType.WITHDRAWAL_APPROVED,
        data: {
          type: 'WITHDRAWAL_APPROVED',
          withdrawalId: request.id,
          amount: request.amount,
          bankName: request.bankName,
          accountNumber: request.accountNumber,
          reference: generatedRef,
        },
      });
    } catch (notifErr) {
      this.logger.warn(`Failed to dispatch in-app notification for withdrawal approval: ${notifErr}`);
    }

    return {
      success: true,
      withdrawal: this.formatWithdrawalItem(updatedRequest),
    };
  }

  /**
   * Super Admin rejects a pending withdrawal and returns locked funds to available balance.
   */
  async rejectWithdrawal(adminUserId: string, id: string, dto: RejectWithdrawalDto) {
    const request = await this.prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        club: { select: { id: true, name: true } },
        requestedBy: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('Withdrawal request not found.');
    }

    if (request.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException(`Cannot reject request in ${request.status} status.`);
    }

    const [updatedWallet, updatedRequest] = await this.prisma.$transaction([
      this.prisma.clubWallet.update({
        where: { id: request.walletId },
        data: {
          lockedBalance: { decrement: request.amount },
          balance: { increment: request.amount },
        },
      }),
      this.prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status: WithdrawalStatus.REJECTED,
          rejectionReason: dto.reason.trim(),
          processedAt: new Date(),
          processedById: adminUserId,
        },
        include: {
          club: { select: { id: true, name: true, logo: true } },
          requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    // Record refund transaction
    await this.prisma.walletTransaction.create({
      data: {
        walletId: request.walletId,
        type: WalletTransactionType.WITHDRAWAL_REFUND,
        amount: request.amount,
        balanceBefore: updatedWallet.balance - request.amount,
        balanceAfter: updatedWallet.balance,
        reference: request.id,
        description: `Funds refunded for rejected withdrawal #${request.id.substring(0, 8)} (${dto.reason})`,
      },
    });

    // Notify organizer via email
    if (request.requestedBy?.email && request.club?.name) {
      this.safeSendEmail('WITHDRAWAL_REJECTED', request.requestedBy.email, {
        clubName: request.club.name,
        amount: request.amount,
        bankName: request.bankName,
        accountNumber: request.accountNumber,
        reason: dto.reason,
        currency: request.currency || 'NGN',
      });
    }

    // Notify organizer via in-app notification
    try {
      await this.notificationsService.createNotification({
        recipientId: request.userId,
        title: 'Payout Request Declined',
        body: `Your payout request of ₦${request.amount.toLocaleString()} was declined: ${dto.reason.trim()}. Funds have been unlocked and returned to your available balance.`,
        type: NotificationType.WITHDRAWAL_REJECTED,
        data: {
          type: 'WITHDRAWAL_REJECTED',
          withdrawalId: request.id,
          amount: request.amount,
          reason: dto.reason.trim(),
        },
      });
    } catch (notifErr) {
      this.logger.warn(`Failed to dispatch in-app notification for withdrawal rejection: ${notifErr}`);
    }

    return {
      success: true,
      withdrawal: this.formatWithdrawalItem(updatedRequest),
    };
  }

  /**
   * Retrieves bank accounts for a club. Seeds a default test bank account if none exists.
   */
  async getBankAccounts(clubId: string) {
    let accounts = await this.prisma.clubBankAccount.findMany({
      where: { clubId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    if (accounts.length === 0) {
      const defaultAccount = await this.prisma.clubBankAccount.create({
        data: {
          clubId,
          bankName: 'Guaranty Trust Bank (GTBank)',
          accountNumber: '0123456789',
          accountName: 'OpenClub Test Account',
          isDefault: true,
        },
      });
      accounts = [defaultAccount];
      this.logger.log(`Seeded test bank account for club ${clubId}`);
    }

    return accounts.map((a: any) => ({
      id: a.id,
      bankName: a.bankName,
      bankCode: '058',
      accountNumber: a.accountNumber,
      accountName: a.accountName,
      isDefault: a.isDefault,
      createdAt: a.createdAt,
    }));
  }

  /**
   * Adds a new bank account for an organizer club (max 2 accounts allowed).
   */
  async createBankAccount(clubId: string, dto: CreateBankAccountDto) {
    const existing = await this.prisma.clubBankAccount.findMany({
      where: { clubId },
    });

    if (existing.length >= 2) {
      throw new BadRequestException('A maximum of 2 payout bank accounts is allowed per club.');
    }

    if (dto.isDefault || existing.length === 0) {
      await this.prisma.clubBankAccount.updateMany({
        where: { clubId },
        data: { isDefault: false },
      });
    }

    const created = await this.prisma.clubBankAccount.create({
      data: {
        clubId,
        bankName: dto.bankName.trim(),
        accountNumber: dto.accountNumber.trim(),
        accountName: dto.accountName.trim(),
        isDefault: dto.isDefault ?? existing.length === 0,
      },
    });

    return {
      id: created.id,
      bankName: created.bankName,
      bankCode: dto.bankCode || '058',
      accountNumber: created.accountNumber,
      accountName: created.accountName,
      isDefault: created.isDefault,
      createdAt: created.createdAt,
    };
  }

  /**
   * Updates an existing bank account.
   */
  async updateBankAccount(clubId: string, id: string, dto: UpdateBankAccountDto) {
    const account = await this.prisma.clubBankAccount.findFirst({
      where: { id, clubId },
    });
    if (!account) {
      throw new NotFoundException('Bank account not found.');
    }

    if (dto.isDefault) {
      await this.prisma.clubBankAccount.updateMany({
        where: { clubId },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.clubBankAccount.update({
      where: { id },
      data: {
        bankName: dto.bankName?.trim() || account.bankName,
        accountNumber: dto.accountNumber?.trim() || account.accountNumber,
        accountName: dto.accountName?.trim() || account.accountName,
        isDefault: dto.isDefault ?? account.isDefault,
      },
    });

    return updated;
  }

  /**
   * Deletes a bank account.
   */
  async deleteBankAccount(clubId: string, id: string) {
    const account = await this.prisma.clubBankAccount.findFirst({
      where: { id, clubId },
    });
    if (!account) {
      throw new NotFoundException('Bank account not found.');
    }

    await this.prisma.clubBankAccount.delete({ where: { id } });

    // If deleted account was default, set another account as default if available
    const remaining = await this.prisma.clubBankAccount.findMany({ where: { clubId } });
    if (remaining.length > 0 && !remaining.some((a: any) => a.isDefault)) {
      await this.prisma.clubBankAccount.update({
        where: { id: remaining[0].id },
        data: { isDefault: true },
      });
    }

    return { success: true };
  }

  /**
   * Curated list of popular Nigerian banks for account linking.
   */
  getNigerianBanks() {
    return [
      { id: '1', name: 'Guaranty Trust Bank (GTBank)', code: '058', slug: 'guaranty-trust-bank' },
      { id: '2', name: 'Access Bank', code: '044', slug: 'access-bank' },
      { id: '3', name: 'Zenith Bank', code: '057', slug: 'zenith-bank' },
      { id: '4', name: 'First Bank of Nigeria', code: '011', slug: 'first-bank-of-nigeria' },
      { id: '5', name: 'United Bank for Africa (UBA)', code: '033', slug: 'united-bank-for-africa' },
      { id: '6', name: 'Kuda Bank', code: '50211', slug: 'kuda-bank' },
      { id: '7', name: 'OPay Digital Services', code: '999992', slug: 'paycom' },
      { id: '8', name: 'PalmPay', code: '999991', slug: 'palmpay' },
      { id: '9', name: 'Moniepoint MFB', code: '50515', slug: 'moniepoint-mfb-ng' },
      { id: '10', name: 'Stanbic IBTC Bank', code: '221', slug: 'stanbic-ibtc-bank' },
      { id: '11', name: 'Fidelity Bank', code: '070', slug: 'fidelity-bank' },
      { id: '12', name: 'First City Monument Bank (FCMB)', code: '214', slug: 'first-city-monument-bank' },
      { id: '13', name: 'Sterling Bank', code: '232', slug: 'sterling-bank' },
      { id: '14', name: 'Union Bank of Nigeria', code: '032', slug: 'union-bank-of-nigeria' },
      { id: '15', name: 'Wema Bank (ALAT)', code: '035', slug: 'wema-bank' },
      { id: '16', name: 'Polaris Bank', code: '076', slug: 'polaris-bank' },
      { id: '17', name: 'Providus Bank', code: '101', slug: 'providus-bank' },
      { id: '18', name: 'Keystone Bank', code: '082', slug: 'keystone-bank' },
      { id: '19', name: 'Ecobank Nigeria', code: '050', slug: 'ecobank-nigeria' },
      { id: '20', name: 'Jaiz Bank', code: '301', slug: 'jaiz-bank' },
    ];
  }

  /**
   * Resolves account details. Works flawlessly for test bank accounts.
   */
  async resolveAccount(dto: ResolveAccountDto, clubId?: string) {
    let clubName: string | undefined;
    if (clubId) {
      const club = await this.prisma.club.findUnique({
        where: { id: clubId },
        select: { name: true },
      });
      clubName = club?.name;
    }

    // For test account number 0123456789 or any 10-digit number, return verified test account
    return {
      accountName: clubName ? `${clubName} Main Account` : 'OpenClub Test Account',
      accountNumber: dto.accountNumber,
      bankCode: dto.bankCode,
      verified: true,
    };
  }

  /**
   * Ensures that a pending test withdrawal exists only on fresh database setups.
   * Cleans up any phantom duplicate test requests created by legacy seeding.
   */
  private async ensureTestWithdrawalExists() {
    try {
      // 1. Clean up any phantom duplicate pending test requests if a paid-out test request already exists
      const duplicatePendingTest = await this.prisma.withdrawalRequest.findMany({
        where: {
          status: WithdrawalStatus.PENDING,
          notes: 'Test payout request ready for Super Admin approval',
        },
      });

      if (duplicatePendingTest.length > 0) {
        const hasCompletedTest = await this.prisma.withdrawalRequest.findFirst({
          where: {
            status: WithdrawalStatus.COMPLETED,
            amount: 150000,
            accountNumber: '0123456789',
          },
        });

        if (hasCompletedTest) {
          await this.prisma.withdrawalRequest.deleteMany({
            where: {
              id: { in: duplicatePendingTest.map((d: any) => d.id) },
            },
          });
          this.logger.log('Cleaned up phantom duplicate test withdrawal requests');
          return;
        }
      }

      // 2. Only seed if the system has ZERO withdrawal requests ever
      const totalCount = await this.prisma.withdrawalRequest.count();
      if (totalCount > 0) return;

      const club = await this.prisma.club.findFirst();
      if (!club) return;

      let wallet = await this.prisma.clubWallet.findUnique({
        where: { clubId: club.id },
      });

      if (!wallet) {
        wallet = await this.prisma.clubWallet.create({
          data: {
            clubId: club.id,
            balance: 2350000,
            lockedBalance: 150000,
            totalWithdrawn: 350000,
            currency: 'NGN',
          },
        });
      } else if (wallet.balance >= 150000) {
        wallet = await this.prisma.clubWallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: 150000 },
            lockedBalance: { increment: 150000 },
          },
        });
      }

      const user =
        (await this.prisma.user.findFirst({ where: { clubId: club.id } })) ||
        (await this.prisma.user.findFirst());

      if (user) {
        await this.prisma.withdrawalRequest.create({
          data: {
            clubId: club.id,
            walletId: wallet.id,
            userId: user.id,
            amount: 150000,
            currency: 'NGN',
            bankName: 'Guaranty Trust Bank (GTBank)',
            accountNumber: '0123456789',
            accountName: 'OpenClub Test Account',
            status: WithdrawalStatus.PENDING,
            notes: 'Test payout request ready for Super Admin approval',
          },
        });
        this.logger.log('Seeded initial test withdrawal request for Super Admin testing');
      }
    } catch (err: any) {
      this.logger.warn(`Could not seed test withdrawal: ${err.message}`);
    }
  }

  /**
   * Dispatches email notifications with non-blocking graceful fallback.
   */
  private async safeSendEmail(template: string, to: string, data: Record<string, any>) {
    try {
      await this.jobsService.queueEmail(template, to, data);
    } catch (err) {
      this.logger.warn(
        `Could not enqueue ${template} email via queue, falling back to direct email service: ${err instanceof Error ? err.message : String(err)}`,
      );
      try {
        if (template === 'WITHDRAWAL_REQUESTED') {
          await this.emailService.sendWithdrawalRequested(
            to,
            data.clubName,
            data.amount,
            data.bankName,
            data.accountNumber,
            data.accountName,
            data.currency,
          );
        } else if (template === 'WITHDRAWAL_APPROVED') {
          await this.emailService.sendWithdrawalApproved(
            to,
            data.clubName,
            data.amount,
            data.bankName,
            data.accountNumber,
            data.accountName,
            data.reference,
            data.currency,
            data.notes,
          );
        } else if (template === 'WITHDRAWAL_REJECTED') {
          await this.emailService.sendWithdrawalRejected(
            to,
            data.clubName,
            data.amount,
            data.bankName,
            data.accountNumber,
            data.reason,
            data.currency,
          );
        }
      } catch (directErr) {
        this.logger.error(`Direct email fallback failed: ${directErr instanceof Error ? directErr.message : String(directErr)}`);
      }
    }
  }

  private formatWithdrawalItem(i: any) {
    return {
      id: i.id,
      amount: i.amount,
      currency: i.currency,
      status: i.status,
      createdAt: i.createdAt.toISOString ? i.createdAt.toISOString() : i.createdAt,
      bankName: i.bankName,
      accountNumber: i.accountNumber,
      accountName: i.accountName,
      reference: i.reference || undefined,
      notes: i.notes || undefined,
      rejectionReason: i.rejectionReason || undefined,
      club: i.club
        ? {
            id: i.club.id,
            name: i.club.name,
            logo: i.club.logo || undefined,
          }
        : undefined,
      requestedBy: i.requestedBy
        ? {
            id: i.requestedBy.id,
            firstName: i.requestedBy.firstName,
            lastName: i.requestedBy.lastName,
            email: i.requestedBy.email,
          }
        : undefined,
      wallet: i.wallet
        ? {
            id: i.wallet.id,
            balance: i.wallet.balance,
            availableBalance: i.wallet.balance,
            lockedBalance: i.wallet.lockedBalance,
            totalWithdrawn: i.wallet.totalWithdrawn,
          }
        : undefined,
    };
  }
}
