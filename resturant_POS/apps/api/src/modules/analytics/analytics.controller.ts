import type { Request, Response } from "express";
import {
  getSalesAnalytics,
  getMenuPerformance,
  getServerPerformance,
  getPeakHours,
  getLaborCostAnalysis,
  getSalesForecast,
  getRealTimeMetrics,
} from "./analytics.service.js";

/**
 * Helper: extracts and validates the restaurantId from the authenticated user.
 */
function getRestaurantId(req: Request): string {
  const id = req.user?.restaurantId;
  if (!id) {
    throw { status: 400, message: "User not associated with a restaurant" };
  }
  return id;
}

export async function salesAnalytics(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { startDate, endDate } = req.query;
    const analytics = await getSalesAnalytics(
      restaurantId,
      startDate as string,
      endDate as string
    );
    res.json(analytics);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to get sales analytics" });
  }
}

export async function menuPerformance(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { startDate, endDate } = req.query;
    const performance = await getMenuPerformance(
      restaurantId,
      startDate as string,
      endDate as string
    );
    res.json(performance);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to get menu performance" });
  }
}

export async function serverPerformance(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { startDate, endDate } = req.query;
    const performance = await getServerPerformance(
      restaurantId,
      startDate as string,
      endDate as string
    );
    res.json(performance);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to get server performance" });
  }
}

export async function peakHours(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { startDate, endDate } = req.query;
    const hours = await getPeakHours(
      restaurantId,
      startDate as string,
      endDate as string
    );
    res.json(hours);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to get peak hours" });
  }
}

export async function laborCost(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { startDate, endDate } = req.query;
    const analysis = await getLaborCostAnalysis(
      restaurantId,
      startDate as string,
      endDate as string
    );
    res.json(analysis);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to get labor cost analysis" });
  }
}

export async function salesForecast(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { days } = req.query;
    const forecast = await getSalesForecast(
      restaurantId,
      days ? parseInt(days as string) : 7
    );
    res.json(forecast);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to get sales forecast" });
  }
}

export async function realTimeMetrics(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const metrics = await getRealTimeMetrics(restaurantId);
    res.json(metrics);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to get real-time metrics" });
  }
}