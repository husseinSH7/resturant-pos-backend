import type { Request, Response } from "express";
import { getTickets, updateTicketStatus } from "./kitchen.service.js";

export async function listTickets(req: Request, res: Response) {
  try {
    const data = await getTickets(req.user!.restaurantId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load kitchen tickets" });
  }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Ticket ID is required" });
    const { status } = req.body;
    const ticket = await updateTicketStatus(req.user!.restaurantId, req.user!.userId, id, status);
    res.json(ticket);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update ticket" });
  }
}
