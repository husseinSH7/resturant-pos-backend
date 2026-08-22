import type { Request, Response } from "express";
import * as deviceService from "./devices.service.js";
import { createDeviceSchema, updateDeviceSchema } from "./devices.schemas.js";

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

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const result = {} as T;
  for (const key in obj) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
}

// ===== LIST =====
export async function listDevices(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const data = await deviceService.listDevices(restaurantId);
    res.json(data);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Failed to load devices" });
  }
}

// ===== CREATE =====
export async function createDeviceController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const parsed = createDeviceSchema.parse(req.body);
    const data = stripUndefined(parsed) as any;
    const device = await deviceService.createDevice(restaurantId, data);
    res.status(201).json(device);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to create device" });
  }
}

// ===== UPDATE =====
export async function updateDeviceController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    const parsed = updateDeviceSchema.parse(req.body);
    const data = stripUndefined(parsed) as any;
    const device = await deviceService.updateDevice(id, restaurantId, data);
    res.json(device);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to update device" });
  }
}

// ===== DELETE =====
export async function deleteDeviceController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    await deviceService.deleteDevice(id, restaurantId);
    res.status(204).send();
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to delete device" });
  }
}

// ===== TEST PRINT =====
export async function testPrintController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    const result = await deviceService.testPrintDevice(id, restaurantId);
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Test print failed" });
  }
}

// ===== HEARTBEAT =====
export async function heartbeatController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { deviceId } = req.body;
    if (!deviceId) throw { status: 400, message: "deviceId is required" };
    const result = await deviceService.heartbeat(restaurantId, deviceId);
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Heartbeat failed" });
  }
}