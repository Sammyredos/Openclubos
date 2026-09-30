import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserRole, WithdrawalStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { WithdrawalsService } from './withdrawals.service';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { ApproveWithdrawalDto } from './dto/approve-withdrawal.dto';
import { RejectWithdrawalDto } from './dto/reject-withdrawal.dto';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/bank-account.dto';
import { ResolveAccountDto } from './dto/resolve-account.dto';

@Controller('withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Get('wallet')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CLUB_ADMIN,
    UserRole.MANAGER,
    UserRole.STAFF,
  )
  async getWallet(@Request() req: any, @Query('clubId') clubId?: string) {
    const role = req.user?.role as UserRole;
    const userClubId = req.user?.clubId;

    const targetClubId = role === UserRole.SUPER_ADMIN ? (clubId || userClubId) : userClubId;
    if (!targetClubId) {
      // Super admin without specific club: return aggregated stats view
      const stats = await this.withdrawalsService.getAdminStats();
      return {
        balance: stats.totalActiveHold,
        availableBalance: stats.totalActiveHold,
        lockedBalance: stats.pendingAmount,
        pendingBalance: stats.pendingAmount,
        totalWithdrawn: stats.totalDisbursed,
        totalRevenue: stats.totalActiveHold + stats.pendingAmount + stats.totalDisbursed,
        currency: 'NGN',
      };
    }

    return this.withdrawalsService.getWallet(targetClubId);
  }

  @Get('admin/stats')
  @Roles(UserRole.SUPER_ADMIN)
  getAdminStats() {
    return this.withdrawalsService.getAdminStats();
  }

  @Get('my')
  @Roles(UserRole.CLUB_ADMIN, UserRole.MANAGER, UserRole.STAFF)
  getMyWithdrawals(
    @Request() req: any,
    @Query('status') status?: WithdrawalStatus,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.withdrawalsService.getMyWithdrawals(req.user.clubId, {
      status,
      take: take ? parseInt(take, 10) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
    });
  }

  @Get('all')
  @Roles(UserRole.SUPER_ADMIN)
  getAllWithdrawals(
    @Query('status') status?: WithdrawalStatus,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.withdrawalsService.getAllWithdrawals({
      status,
      take: take ? parseInt(take, 10) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
    });
  }

  @Post('request')
  @Roles(UserRole.CLUB_ADMIN, UserRole.MANAGER)
  requestWithdrawal(@Request() req: any, @Body() dto: RequestWithdrawalDto) {
    return this.withdrawalsService.requestWithdrawal(
      req.user.id,
      req.user.clubId,
      dto,
    );
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN)
  approveWithdrawal(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ApproveWithdrawalDto,
  ) {
    return this.withdrawalsService.approveWithdrawal(req.user.id, id, dto);
  }

  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN)
  rejectWithdrawal(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: RejectWithdrawalDto,
  ) {
    return this.withdrawalsService.rejectWithdrawal(req.user.id, id, dto);
  }

  @Get('bank-accounts')
  @Roles(UserRole.CLUB_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  getBankAccounts(@Request() req: any, @Query('clubId') clubId?: string) {
    const effectiveClubId = req.user?.clubId || clubId;
    return this.withdrawalsService.getBankAccounts(effectiveClubId);
  }

  @Post('bank-accounts')
  @Roles(UserRole.CLUB_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  createBankAccount(
    @Request() req: any,
    @Body() dto: CreateBankAccountDto & { clubId?: string },
  ) {
    const effectiveClubId = req.user?.clubId || dto.clubId;
    return this.withdrawalsService.createBankAccount(effectiveClubId, dto);
  }

  @Patch('bank-accounts/:id')
  @Roles(UserRole.CLUB_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  updateBankAccount(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBankAccountDto & { clubId?: string },
  ) {
    const effectiveClubId = req.user?.clubId || dto.clubId;
    return this.withdrawalsService.updateBankAccount(effectiveClubId, id, dto);
  }

  @Delete('bank-accounts/:id')
  @Roles(UserRole.CLUB_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  deleteBankAccount(@Request() req: any, @Param('id') id: string) {
    return this.withdrawalsService.deleteBankAccount(req.user.clubId, id);
  }

  @Get('banks')
  getNigerianBanks() {
    return this.withdrawalsService.getNigerianBanks();
  }

  @Post('resolve-account')
  resolveAccount(@Request() req: any, @Body() dto: ResolveAccountDto) {
    return this.withdrawalsService.resolveAccount(dto, req.user?.clubId);
  }
}
