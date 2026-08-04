import type { Request, Response } from "express";
import {
  getReservations,
  createReservation,
  updateReservationStatus,
  checkAvailability,
  getWaitlist,
  addToWaitlist,
  updateWaitlistStatus,
  getNoShowStats,
} from "./reservations.service.js";

export async function list(req: Request, res: Response) {
  try {
    const { date, status } = req.query;
    const data = await getReservations(req.user!.restaurantId, {
      date: date as string,
      status: status as string,
    });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load reservations" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerId,
      guestCount,
      date,
      time,
      tableId,
      notes,
      specialRequests,
    } = req.body;

    if (!customerName || !guestCount || !date || !time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const reservation = await createReservation(req.user!.restaurantId, {
      customerName,
      customerPhone,
      customerEmail,
      customerId,
      guestCount: Number(guestCount),
      date,
      time,
      tableId,
      notes,
      specialRequests,
    });

    res.status(201).json(reservation);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create reservation" });
  }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const result = await updateReservationStatus(req.user!.restaurantId, id, status);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update reservation" });
  }
}

export async function checkAvailabilityController(req: Request, res: Response) {
  try {
    const { date, guestCount } = req.query;

    if (!date || !guestCount) {
      return res.status(400).json({ message: "Date and guest count are required" });
    }

    const availability = await checkAvailability(
      req.user!.restaurantId,
      date as string,
      Number(guestCount)
    );

    res.json(availability);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to check availability" });
  }
}

// Waitlist controllers
export async function listWaitlist(req: Request, res: Response) {
  try {
    const data = await getWaitlist(req.user!.restaurantId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load waitlist" });
  }
}

export async function addToWaitlistController(req: Request, res: Response) {
  try {
    const { customerName, customerPhone, customerId, guestCount, notes } = req.body;

    if (!customerName || !guestCount) {
      return res.status(400).json({ message: "Customer name and guest count are required" });
    }

    const entry = await addToWaitlist(req.user!.restaurantId, {
      customerName,
      customerPhone,
      customerId,
      guestCount: Number(guestCount),
      notes,
    });

    res.status(201).json(entry);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to add to waitlist" });
  }
}

export async function updateWaitlistStatusController(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const result = await updateWaitlistStatus(req.user!.restaurantId, id, status);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update waitlist" });
  }
}

export async function getNoShowStatsController(req: Request, res: Response) {
  try {
    const stats = await getNoShowStats(req.user!.restaurantId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get no-show stats" });
  }
}