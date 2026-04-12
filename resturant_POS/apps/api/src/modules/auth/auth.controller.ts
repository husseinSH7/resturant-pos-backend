import type { Request, Response } from "express";
import { loginWithPin } from "./auth.service.js";

export async function login(req: Request, res: Response) {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ message: "PIN is required" });
    }

    const result = await loginWithPin(pin);

    res.json(result);
  } catch (error: any) {
    res.status(401).json({
      message: error.message || "Login failed",
    });
  }
}