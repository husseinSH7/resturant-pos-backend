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

export async function salesAnalytics(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await getSalesAnalytics(
      req.user!.restaurantId,
      startDate as string,
      endDate as string
    );
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get sales analytics" });
  }
}

export async function menuPerformance(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    const performance = await getMenuPerformance(
      req.user!.restaurantId,
      startDate as string,
      endDate as string
    );
    res.json(performance);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get menu performance" });
  }
}

export async function serverPerformance(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    const performance = await getServerPerformance(
      req.user!.restaurantId,
      startDate as string,
      endDate as string
    );
    res.json(performance);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get server performance" });
  }
}

export async function peakHours(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    const hours = await getPeakHours(
      req.user!.restaurantId,
      startDate as string,
      endDate as string
    );
    res.json(hours);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get peak hours" });
  }
}

export async function laborCost(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    const analysis = await getLaborCostAnalysis(
      req.user!.restaurantId,
      startDate as string,
      endDate as string
    );
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get labor cost analysis" });
  }
}

export async function salesForecast(req: Request, res: Response) {
  try {
    const { days } = req.query;
    const forecast = await getSalesForecast(
      req.user!.restaurantId,
      days ? parseInt(days as string) : 7
    );
    res.json(forecast);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get sales forecast" });
  }
}

export async function realTimeMetrics(req: Request, res: Response) {
  try {
    const metrics = await getRealTimeMetrics(req.user!.restaurantId);
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get real-time metrics" });
  }
}