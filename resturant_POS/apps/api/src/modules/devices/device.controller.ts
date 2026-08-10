import type { Request, Response } from "express";
import { prisma } from "../../prisma.js";
import { DeviceType } from "@prisma/client";

export async function registerDevice(req: Request, res: Response) {
  try {
    const { deviceId, deviceType, name } = req.body;

    if (!req.user?.restaurantId) {
      res.status(401).json({ message: "Unauthorized: no restaurant context" });
      return;
    }

    // Build data object, only include 'name' if it's provided
    const data: Record<string, unknown> = {
      restaurantId: req.user.restaurantId,
      deviceId,
      deviceType: deviceType as DeviceType,
      lastSeenAt: new Date(),
    };
    if (name !== undefined) {
      data.name = name;
    }

    const device = await prisma.device.create({ data: data as any });
    res.status(201).json(device);
  } catch (error) {
    console.error("Error registering device:", error);
    res.status(500).json({ message: "Failed to register device" });
  }
}

export async function listDevices(req: Request, res: Response) {
  try {
    if (!req.user?.restaurantId) {
      res.status(401).json({ message: "Unauthorized: no restaurant context" });
      return;
    }

    const devices = await prisma.device.findMany({
      where: { restaurantId: req.user.restaurantId },
      orderBy: { createdAt: "desc" },
    });

    res.json(devices);
  } catch (error) {
    console.error("Error listing devices:", error);
    res.status(500).json({ message: "Failed to list devices" });
  }
}

export async function updateDevice(req: Request, res: Response) {
  try {
    if (!req.user?.restaurantId) {
      res.status(401).json({ message: "Unauthorized: no restaurant context" });
      return;
    }

    const id = req.params.id;
    if (typeof id !== "string") {
      res.status(400).json({ message: "Invalid device ID" });
      return;
    }

    const { name, isActive } = req.body;

    // Build update data, only include properties that are defined
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;

    const device = await prisma.device.updateMany({
      where: { 
        id,
        restaurantId: req.user.restaurantId 
      },
      data: updateData,
    });

    if (device.count === 0) {
      res.status(404).json({ message: "Device not found" });
      return;
    }

    const updatedDevice = await prisma.device.findUnique({
      where: { id },
    });

    res.json(updatedDevice);
  } catch (error) {
    console.error("Error updating device:", error);
    res.status(500).json({ message: "Failed to update device" });
  }
}

export async function heartbeat(req: Request, res: Response) {
  try {
    const { deviceId } = req.body;

    if (!req.user?.restaurantId) {
      res.status(401).json({ message: "Unauthorized: no restaurant context" });
      return;
    }

    const device = await prisma.device.updateMany({
      where: { 
        deviceId,
        restaurantId: req.user.restaurantId 
      },
      data: { lastSeenAt: new Date() },
    });

    if (device.count === 0) {
      res.status(404).json({ message: "Device not found" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating device heartbeat:", error);
    res.status(500).json({ message: "Failed to update heartbeat" });
  }
}