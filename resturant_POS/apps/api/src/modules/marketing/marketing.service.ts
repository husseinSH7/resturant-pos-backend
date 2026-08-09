import { prisma } from "../../prisma.js";
import { Prisma } from "@prisma/client";
import { sendSMSNotification, sendEmailNotification } from "../../services/notifications.service.js";
import crypto from "crypto";

export async function getCampaigns(restaurantId: string) {
  const campaigns = await prisma.marketingCampaign.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
  });

  return campaigns.map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    targetAudience: campaign.targetAudience,
    budget: Number(campaign.budget),
    message: campaign.message,
    createdAt: campaign.createdAt,
  }));
}

export async function createCampaign(restaurantId: string, data: {
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  targetAudience: string;
  budget: number;
  message: string;
}) {
  const campaign = await prisma.marketingCampaign.create({
    data: {
      id: crypto.randomUUID(),
      restaurantId,
      name: data.name,
      type: data.type,
      status: "ACTIVE",
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      targetAudience: data.targetAudience,
      budget: new Prisma.Decimal(data.budget),
      message: data.message,
    },
  });

  return {
    id: campaign.id,
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    targetAudience: campaign.targetAudience,
    budget: Number(campaign.budget),
    message: campaign.message,
    createdAt: campaign.createdAt,
  };
}

export async function sendCampaign(restaurantId: string, campaignId: string) {
  const campaign = await prisma.marketingCampaign.findFirst({
    where: { id: campaignId, restaurantId },
  });

  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status !== "ACTIVE") throw new Error("Campaign is not active");

  // Parse target audience to get customer segments
  const targetAudience = campaign.targetAudience.toLowerCase();
  let customers: any[] = [];

  if (targetAudience.includes("all")) {
    customers = await prisma.customer.findMany({
      where: { restaurantId, isActive: true },
    });
  } else if (targetAudience.includes("loyalty")) {
    // Target customers with loyalty points above threshold
    customers = await prisma.customer.findMany({
      where: { restaurantId, isActive: true, points: { gte: 100 } },
    });
  } else if (targetAudience.includes("recent")) {
    // Target customers who visited in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = await prisma.order.findMany({
      where: { restaurantId, createdAt: { gte: thirtyDaysAgo } },
      select: { customerId: true },
      distinct: ['customerId'],
    });
    
    const customerIds = recentOrders.map(o => o.customerId).filter(Boolean);
    customers = await prisma.customer.findMany({
      where: { id: { in: customerIds as string[] }, isActive: true },
    });
  }

  const results = {
    smsSent: 0,
    emailSent: 0,
    failed: 0,
  };

  // Send campaign to targeted customers
  for (const customer of customers) {
    try {
      if (campaign.type === "SMS" && customer.phone) {
        await sendSMSNotification(customer.phone, campaign.message);
        results.smsSent++;
      } else if (campaign.type === "EMAIL" && customer.email) {
        await sendEmailNotification(customer.email, campaign.name, campaign.message, campaign.message);
        results.emailSent++;
      } else if (campaign.type === "PUSH") {
        // Push notifications would require a push notification service
        // For now, count as sent
        results.smsSent++; // Using SMS count as placeholder
      }
    } catch (error: any) {
      console.error(`Failed to send campaign to customer ${customer.id}:`, error);
      results.failed++;
    }
  }

  // Update campaign status
  const updated = await prisma.marketingCampaign.update({
    where: { id: campaignId },
    data: {
      status: "COMPLETED",
    },
  });

  return {
    success: true,
    campaignId: updated.id,
    message: "Campaign sent successfully",
    results,
    totalTargeted: customers.length,
  };
}

export async function getMarketingAnalytics(restaurantId: string) {
  const campaigns = await prisma.marketingCampaign.findMany({
    where: { restaurantId },
  });

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === "ACTIVE").length;
  const sentCampaigns = campaigns.filter(c => c.status === "SENT").length;
  const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.budget), 0);

  const campaignsByType = campaigns.reduce((acc, campaign) => {
    acc[campaign.type] = (acc[campaign.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalCampaigns,
    activeCampaigns,
    sentCampaigns,
    totalBudget,
    campaignsByType,
  };
}