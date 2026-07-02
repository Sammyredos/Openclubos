import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id }
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async create(data: any) {
    return this.prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        description: data.description,
        amount: parseFloat(data.amount),
        currency: data.currency || 'NGN',
        billingCycle: data.billingCycle || 'MONTHLY',
        targetAudience: data.targetAudience || 'ORGANIZER',
        features: data.features || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });
  }

  async update(id: string, data: any) {
    const plan = await this.findOne(id);
    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : plan.name,
        description: data.description !== undefined ? data.description : plan.description,
        amount: data.amount !== undefined ? parseFloat(data.amount) : plan.amount,
        currency: data.currency !== undefined ? data.currency : plan.currency,
        billingCycle: data.billingCycle !== undefined ? data.billingCycle : plan.billingCycle,
        targetAudience: data.targetAudience !== undefined ? data.targetAudience : plan.targetAudience,
        features: data.features !== undefined ? data.features : plan.features,
        isActive: data.isActive !== undefined ? data.isActive : plan.isActive,
      }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.subscriptionPlan.delete({
      where: { id }
    });
  }

  async getAdminStats(type?: string) {
    const whereClause: any = {};
    if (type === 'ORGANIZER') {
      whereClause.clubId = { not: null };
    } else if (type === 'PLAYER') {
      whereClause.userId = { not: null };
    }

    const subscriptions = await this.prisma.subscription.findMany({
      where: whereClause,
      include: {
        club: {
          include: { users: true }
        },
        user: true,
        subscriptionPlan: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const items = subscriptions.map((sub) => {
      let name = '';
      let email = '';

      if (sub.club) {
        name = sub.club.name;
        email = sub.club.users && sub.club.users.length > 0 ? sub.club.users[0].email : 'N/A';
      } else if (sub.user) {
        name = `${sub.user.firstName || ''} ${sub.user.lastName || ''}`.trim() || sub.user.email;
        email = sub.user.email;
      }

      const initials = name.substring(0, 2).toUpperCase() || 'NA';
      
      const colors = ['bg-emerald-100 text-emerald-700', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700'];
      const avatarColor = colors[Math.abs(initials.charCodeAt(0) + initials.charCodeAt(1)) % colors.length];

      return {
        id: sub.id,
        organizer: name,
        email: email,
        avatarColor,
        initials,
        plan: sub.subscriptionPlan.name.replace(' Organizer', '').replace(' Player', ''),
        planLimit: sub.subscriptionPlan.features.length > 0 ? sub.subscriptionPlan.features[0] : 'Standard Limits',
        billingCycle: sub.subscriptionPlan.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly',
        status: sub.status === 'PAST_DUE' ? 'Past Due' : sub.status.charAt(0) + sub.status.slice(1).toLowerCase(),
        nextBillingDate: sub.nextBillingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        nextBillingSub: 'Auto-renews',
        amount: `₦${sub.subscriptionPlan.amount.toLocaleString()}${sub.subscriptionPlan.billingCycle === 'ANNUAL' ? '/yr' : '/mo'}`
      };
    });

    const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length;
    const pastDueCount = subscriptions.filter(s => s.status === 'PAST_DUE').length;
    
    // Calculate Monthly Revenue
    const monthlyRevenue = subscriptions.reduce((acc, sub) => {
      if (sub.status !== 'ACTIVE') return acc;
      const amount = sub.subscriptionPlan.amount;
      return acc + (sub.subscriptionPlan.billingCycle === 'ANNUAL' ? amount / 12 : amount);
    }, 0);

    const annualRevenue = monthlyRevenue * 12;

    return {
      items,
      total: items.length,
      stats: {
        activeSubscriptions: activeCount,
        monthlyRevenue: monthlyRevenue,
        annualRevenue: annualRevenue,
        pastDue: pastDueCount,
      }
    };
  }
}
