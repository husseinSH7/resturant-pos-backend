import { prisma } from "../../prisma.js";
import { DeviceType } from "@prisma/client";
import crypto from "crypto";

export async function listDevices(restaurantId: string) {
  const devices = await prisma.device.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
  });

  return devices.map((device) => ({
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
}

export async function createDevice(
  restaurantId: string,
  data: {
    name: string;
    type: string;
    deviceId: string;
    ipAddress?: string;
  }
) {
  const device = await prisma.device.create({
    data: {
      id: crypto.randomUUID(),
      restaurantId,
      name: data.name,
      deviceType: data.type as DeviceType,
      deviceId: data.deviceId,
      ipAddress: data.ipAddress || null,
      isActive: true,
      lastSeenAt: new Date(),
    },
  });

  return {
    id: device.id,
    deviceId: device.deviceId,
    name: device.name || device.deviceId,
    type: device.deviceType,
    status: "ONLINE",
    lastSeen: device.lastSeenAt?.toISOString() || new Date().toISOString(),
    ipAddress: device.ipAddress || "N/A",
    isActive: device.isActive,
    registeredAt: device.createdAt.toISOString().split("T")[0],
    currentStaff: null,
  };
}

export async function updateDevice(
  id: string,
  restaurantId: string,
  data: {
    name?: string;
    type?: string;
    deviceId?: string;
    ipAddress?: string;
    isActive?: boolean;
  }
) {
  const device = await prisma.device.findFirst({
    where: { id, restaurantId },
  });
  if (!device) throw new Error("Device not found");

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.deviceType = data.type as DeviceType;
  if (data.deviceId !== undefined) updateData.deviceId = data.deviceId;
  if (data.ipAddress !== undefined) updateData.ipAddress = data.ipAddress;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const updated = await prisma.device.update({
    where: { id },
    data: updateData,
  });

  return {
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
    currentStaff: null,
  };
}

export async function deleteDevice(id: string, restaurantId: string) {
  const device = await prisma.device.findFirst({
    where: { id, restaurantId },
  });
  if (!device) throw new Error("Device not found");
  await prisma.device.delete({ where: { id } });
  return { success: true };
}

export async function testPrintDevice(id: string, restaurantId: string) {
  const device = await prisma.device.findFirst({
    where: { id, restaurantId },
  });
  if (!device) throw new Error("Device not found");

  // Now DeviceType includes PRINTER, so this comparison is safe
  if (device.deviceType !== "PRINTER") {
    throw new Error("Device is not a printer");
  }

  // Simulate print – replace with actual printer logic
  console.log(`📠 Test print sent to printer ${device.name} at ${device.ipAddress || 'unknown'}`);

  return { success: true, message: `Test print sent to ${device.name}` };
}

export async function heartbeat(restaurantId: string, deviceId: string) {
  const device = await prisma.device.findFirst({
    where: { deviceId, restaurantId },
  });
  if (!device) throw new Error("Device not found");

  await prisma.device.update({
    where: { id: device.id },
    data: { lastSeenAt: new Date() },
  });

  return { success: true };
}