import type { Request, Response } from "express";
import { loginWithPin, loginWithEmailPassword, refreshTokens, forgotPassword as forgotPasswordService, resetPassword as resetPasswordService, verifyEmail as verifyEmailService, resendVerificationEmail as resendVerificationEmailService, createOwnerInvite as createOwnerInviteService, acceptOwnerInvite as acceptOwnerInviteService } from "./auth.service.js";
import { loginSchema, refreshSchema, emailLoginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, resendVerificationSchema, createInviteSchema, acceptInviteSchema } from "./auth.schemas.js";

export async function login(req: Request, res: Response) {
  try {
    const validatedData = loginSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');
    const result = await loginWithPin(validatedData.pin, ipAddress, userAgent);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(401).json({
        message: error.message || "Login failed",
      });
    }
  }
}

export async function loginWithEmail(req: Request, res: Response) {
  try {
    const validatedData = emailLoginSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');
    const result = await loginWithEmailPassword(validatedData.email, validatedData.password, ipAddress, userAgent);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(401).json({
        message: error.message || "Login failed",
      });
    }
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const validatedData = refreshSchema.parse(req.body);
    const result = await refreshTokens(validatedData.refreshToken);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(401).json({
        message: error.message || "Token refresh failed",
      });
    }
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    const result = await forgotPasswordService(validatedData.email);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(500).json({
        message: error.message || "Password reset request failed",
      });
    }
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const result = await resetPasswordService(validatedData.token, validatedData.newPassword);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(400).json({
        message: error.message || "Password reset failed",
      });
    }
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const validatedData = verifyEmailSchema.parse(req.body);
    const result = await verifyEmailService(validatedData.token);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(400).json({
        message: error.message || "Email verification failed",
      });
    }
  }
}

export async function resendVerificationEmail(req: Request, res: Response) {
  try {
    const validatedData = resendVerificationSchema.parse(req.body);
    const result = await resendVerificationEmailService(validatedData.email);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(500).json({
        message: error.message || "Failed to resend verification email",
      });
    }
  }
}

export async function createOwnerInvite(req: Request, res: Response) {
  try {
    const validatedData = createInviteSchema.parse(req.body);
    const result = await createOwnerInviteService(validatedData.email, validatedData.restaurantName);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(500).json({
        message: error.message || "Failed to create invite",
      });
    }
  }
}

export async function acceptOwnerInvite(req: Request, res: Response) {
  try {
    const validatedData = acceptInviteSchema.parse(req.body);
    const result = await acceptOwnerInviteService(validatedData.token, validatedData.password, validatedData.fullName);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(400).json({
        message: error.message || "Failed to accept invite",
      });
    }
  }
}