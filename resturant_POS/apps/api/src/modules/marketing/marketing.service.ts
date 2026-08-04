import { prisma } from "../../prisma.js";
import { Prisma } from "@prisma/client";

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

  // In a real implementation, this would integrate with email/SMS services
  // For now, we'll simulate sending the campaign
  const updated = await prisma.marketingCampaign.update({
    where: { id: campaignId },
    data: {
      status: "SENT",
    },
  });

  return {
    success: true,
    campaignId: updated.id,
    message: "Campaign sent successfully",
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