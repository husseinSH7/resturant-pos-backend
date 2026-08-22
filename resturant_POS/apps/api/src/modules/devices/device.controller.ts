import type { Request, Response } from "express";
import { prisma } from "../../prisma.js";
import { DeviceType } from "@prisma/client";
import crypto from "crypto";

function getRestaurantId(req: Request): string {
  const id = req.user?.restaurantId;
  if (!id) {
    throw { status: 400, message: "User not associated with a restaurant" };
  }
  return id;
}

function getParamId(req: Request): string {
  const { id } = req.params;
  if (!id || typeof id !== "string") {
    throw { status: 400, message: "Invalid or missing ID" };
  }
  return id;
}

// ===== LIST DEVICES =====
export async function listDevices(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const devices = await prisma.device.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });

    const formatted = devices.map((device) => ({
      id: device.id,
      deviceId: device.deviceId,
      name: device.name || device.deviceId,
      type: device.deviceType,
      status: device.lastSeenAt
        ? Date.now() - new Date(device.lastSeenAt).getTime() < 60000
          ? "ONLINE"
          : "OFFLINE"
        : "OFFLINE",
      lastSeen: device.lastSeenAt?.toISOString() || new Date().toISOString(),
      ipAddress: device.ipAddress || "N/A",
      isActive: device.isActive,
      registeredAt: device.createdAt.toISOString().split("T")[0],
      currentStaff: null,
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load devices" });
  }
}

// ===== REGISTER DEVICE =====
export async function registerDevice(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { deviceId, deviceType, name, ipAddress } = req.body;

    if (!deviceId || !deviceType) {
      throw { status: 400, message: "Device ID and type are required" };
    }

    const device = await prisma.device.create({
      data: {
        id: crypto.randomUUID(),
        restaurantId,
        deviceId,
        deviceType: deviceType as DeviceType,
        name: name || null,
        ipAddress: ipAddress || null,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });

    res.status(201).json({
      id: device.id,
      deviceId: device.deviceId,
      name: device.name || device.deviceId,
      type: device.deviceType,
      status: "ONLINE",
      lastSeen: device.lastSeenAt?.toISOString() || new Date().toISOString(),
      ipAddress: device.ipAddress || "N/A",
      isActive: device.isActive,
      registeredAt: device.createdAt.toISOString().split("T")[0],
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to register device" });
  }
}

// ===== UPDATE DEVICE =====
export async function updateDevice(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    const { name, ipAddress, isActive } = req.body;

    const device = await prisma.device.findFirst({
      where: { id, restaurantId },
    });
    if (!device) throw { status: 404, message: "Device not found" };

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (ipAddress !== undefined) updateData.ipAddress = ipAddress;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.device.update({
      where: { id },
      data: updateData,
    });

    res.json({
      id: updated.id,
      deviceId: updated.deviceId,
      name: updated.name || updated.deviceId,
      type: updated.deviceType,
      status: updated.lastSeenAt
        ? Date.now() - new Date(updated.lastSeenAt).getTime() < 60000
          ? "ONLINE"
          : "OFFLINE"
        : "OFFLINE",
      lastSeen: updated.lastSeenAt?.toISOString() || new Date().toISOString(),
      ipAddress: updated.ipAddress || "N/A",
      isActive: updated.isActive,
      registeredAt: updated.createdAt.toISOString().split("T")[0],
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update device" });
  }
}

// ===== DELETE DEVICE =====
export async function deleteDevice(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);

    const device = await prisma.device.findFirst({
      where: { id, restaurantId },
    });
    if (!device) throw { status: 404, message: "Device not found" };

    await prisma.device.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to delete device" });
  }
}

// ===== HEARTBEAT =====
export async function heartbeat(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { deviceId } = req.body;

    if (!deviceId) throw { status: 400, message: "deviceId is required" };

    const device = await prisma.device.findFirst({
      where: { deviceId, restaurantId },
    });
    if (!device) throw { status: 404, message: "Device not found" };

    await prisma.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Heartbeat failed" });
  }
}

// ===== TEST PRINT =====
export async function testPrint(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);

    const device = await prisma.device.findFirst({
      where: { id, restaurantId, isActive: true },
    });
    if (!device) throw { status: 404, message: "Device not found" };
    if (device.deviceType !== "PRINTER") {
      throw { status: 400, message: "Device is not a printer" };
    }
    if (!device.ipAddress) {
      throw { status: 400, message: "Printer has no IP address configured" };
    }

    // Send test print
    const testContent = `
================================
        TEST PRINT
================================
Printer: ${device.name}
Device ID: ${device.deviceId}
IP Address: ${device.ipAddress}
Date: ${new Date().toLocaleString()}
================================
    This is a test print.
    Your printer is working!
================================
\n\n\n
`;

    await sendPrintJob(device.ipAddress, testContent);

    res.json({ success: true, message: "Test print sent successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Test print failed" });
  }
}

// ===== PRINT RECEIPT =====
export async function printReceipt(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    const { content } = req.body;

    if (!content) {
      throw { status: 400, message: "Print content is required" };
    }

    const device = await prisma.device.findFirst({
      where: { id, restaurantId, isActive: true },
    });
    if (!device) throw { status: 404, message: "Device not found" };
    if (device.deviceType !== "PRINTER") {
      throw { status: 400, message: "Device is not a printer" };
    }
    if (!device.ipAddress) {
      throw { status: 400, message: "Printer has no IP address configured" };
    }

    await sendPrintJob(device.ipAddress, content);

    res.json({ success: true, message: "Receipt sent to printer" });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Print failed" });
  }
}

// ----- Helper: Send print job via TCP -----
async function sendPrintJob(ip: string, content: string): Promise<void> {
  const net = await import('net');

  return new Promise((resolve, reject) => {
    const client = net.createConnection(9100, ip, () => {
      client.write(content);
      client.end();
    });

    client.on('error', (err) => {
      reject(new Error(`Failed to connect to printer: ${err.message}`));
    });

    client.on('end', () => {
      resolve();
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      client.destroy();
      reject(new Error('Print timeout'));
    }, 10000);
  });
}