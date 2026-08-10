import type { Request, Response } from "express";
import { getTickets, updateTicketStatus } from "./kitchen.service.js";

/**
 * Helper: extracts and validates restaurantId and userId from the authenticated user.
 */
function getKitchenContext(req: Request) {
  const restaurantId = req.user?.restaurantId;
  if (!restaurantId) {
    throw { status: 400, message: "User not associated with a restaurant" };
  }
  const userId = req.user?.userId;
  if (!userId) {
    throw { status: 400, message: "Invalid user ID" };
  }
  return { restaurantId, userId };
}

export async function listTickets(req: Request, res: Response) {
  try {
    const { restaurantId } = getKitchenContext(req);
    const data = await getTickets(restaurantId);
    res.json(data);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to load kitchen tickets" });
  }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const { restaurantId, userId } = getKitchenContext(req);
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Ticket ID is required" });
    const { status } = req.body;
    const ticket = await updateTicketStatus(restaurantId, userId, id, status);
    res.json(ticket);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Failed to update ticket" });
  }
}