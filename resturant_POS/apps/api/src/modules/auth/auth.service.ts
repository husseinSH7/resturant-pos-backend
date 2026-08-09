import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../../prisma.js";
import { createAuditLog } from "../../services/audit.service.js";
import { SubscriptionStatus } from "@prisma/client";
import { sendPasswordResetEmail, sendEmailVerificationEmail, sendOwnerInviteEmail } from "../../services/email.service.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

export async function comparePin(pin: string, hashedPin: string): Promise<boolean> {
  return bcrypt.compare(pin, hashedPin);
}

export async function generateTokens(userId: string, restaurantId: string | null, role: string) {
  const accessToken = jwt.sign(
    { userId, restaurantId, role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId, restaurantId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

export async function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      restaurantId: string;
      role: string;
    };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as {
      userId: string;
      restaurantId: string;
      type: string;
    };

    if (decoded.type !== 'refresh') {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export async function refreshTokens(refreshToken: string) {
  const decoded = await verifyRefreshToken(refreshToken);

  if (!decoded) {
    throw new Error("Invalid refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { restaurant: true },
  });

  if (!user || !user.isActive) {
    throw new Error("User not found or inactive");
  }

  const restaurantId = user.restaurantId || "PLATFORM";
  const tokens = await generateTokens(user.id, restaurantId, user.role);

  return {
    ...tokens,
    user: {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
    },
    restaurantId: user.restaurantId,
  };
}

export async function loginWithEmailPassword(email: string, password: string, ipAddress?: string, userAgent?: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { restaurant: true },
  });

  if (!user || !user.isActive) {
    throw new Error("Invalid credentials");
  }

  if (!user.passwordHash) {
    throw new Error("User must set a password first");
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error("Invalid credentials");
  }

  // For platform admins, restaurantId will be null
  const restaurantId = user.restaurantId || "PLATFORM";

  const tokens = await generateTokens(user.id, restaurantId, user.role);

  if (user.restaurantId) {
    await createAuditLog({
      restaurantId: user.restaurantId,
      userId: user.id,
      action: "LOGIN",
      entityType: "USER",
      entityId: user.id,
      details: `User ${user.fullName} logged in via email/password`,
      ...(ipAddress && { ipAddress }),
      ...(userAgent && { userAgent }),
    });
  }

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
    },
    restaurantId: user.restaurantId,
  };
}

export async function loginWithPin(pin: string, ipAddress?: string, userAgent?: string) {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      pin: { not: null }, // Only users with PIN can login via PIN
    },
    include: {
      restaurant: true,
    },
  });

  let user = null;
  for (const u of users) {
    if (u.pin && await comparePin(pin, u.pin)) {
      user = u;
      break;
    }
  }

  if (!user) {
    throw new Error("Invalid PIN");
  }

  // Platform admins shouldn't login via PIN - they should use email/password
  if (user.role === "PLATFORM_ADMIN") {
    throw new Error("Platform admins must use email/password login");
  }

  if (!user.restaurantId) {
    throw new Error("User must be associated with a restaurant");
  }

  const tokens = await generateTokens(user.id, user.restaurantId, user.role);

  await createAuditLog({
    restaurantId: user.restaurantId,
    userId: user.id,
    action: "LOGIN",
    entityType: "USER",
    entityId: user.id,
    details: `User ${user.fullName} logged in via PIN`,
    ...(ipAddress && { ipAddress }),
    ...(userAgent && { userAgent }),
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
    },
    restaurantId: user.restaurantId,
  };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if email exists or not for security
    return { message: "If the email exists, a reset link has been sent" };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

  // Store reset token in database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetTokenExpiry,
    },
  });

  // Send email with reset link
  await sendPasswordResetEmail(email, resetToken);
  
  return { 
    message: "If the email exists, a reset link has been sent",
  };
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new Error("Invalid or expired reset token");
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  // Log the password reset for audit purposes
  if (user.restaurantId) {
    await createAuditLog({
      restaurantId: user.restaurantId,
      userId: user.id,
      action: "PASSWORD_RESET",
      entityType: "USER",
      entityId: user.id,
      details: `User ${user.fullName} reset their password`,
    });
  }

  return { message: "Password reset successfully" };
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new Error("Invalid or expired verification token");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    },
  });

  // Log the email verification for audit purposes
  if (user.restaurantId) {
    await createAuditLog({
      restaurantId: user.restaurantId,
      userId: user.id,
      action: "EMAIL_VERIFIED",
      entityType: "USER",
      entityId: user.id,
      details: `User ${user.fullName} verified their email`,
    });
  }

  return { message: "Email verified successfully" };
}

export async function resendVerificationEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { message: "If the email exists, a verification link has been sent" };
  }

  if (user.emailVerified) {
    return { message: "Email is already verified" };
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  // Store token in database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    },
  });

  // Send email with verification link
  await sendEmailVerificationEmail(email, verificationToken);
  
  return { 
    message: "If the email exists, a verification link has been sent",
  };
}

export async function createOwnerInvite(email: string, restaurantName: string) {
  // Check if user already exists with this email
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  // Generate invite token
  const inviteToken = crypto.randomBytes(32).toString('hex');
  const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  // Store invite in database
  const invite = await prisma.ownerInvite.create({
    data: {
      email,
      restaurantName,
      token: inviteToken,
      expiresAt: inviteExpiry,
    },
  });

  const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${inviteToken}`;

  // Send email with invite link
  await sendOwnerInviteEmail(email, restaurantName, inviteToken);

  return {
    message: "Invite created successfully",
    inviteLink,
    expiresAt: invite.expiresAt,
  };
}

export async function acceptOwnerInvite(token: string, password: string, fullName: string) {
  // Validate invite token from database
  const invite = await prisma.ownerInvite.findUnique({
    where: { token },
  });

  if (!invite) {
    throw new Error("Invalid invite token");
  }

  if (invite.expiresAt < new Date()) {
    throw new Error("Invite token has expired");
  }

  if (invite.acceptedAt) {
    throw new Error("Invite has already been accepted");
  }

  // Check if user already exists with this email
  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
  });

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create the restaurant first
  const restaurant = await prisma.restaurant.create({
    data: {
      name: invite.restaurantName,
      slug: invite.restaurantName.toLowerCase().replace(/\s+/g, '-'),
      isActive: true,
    },
  });

  // Create default subscription (trial)
  const defaultPlan = await prisma.plan.findFirst({
    where: { isActive: true },
    orderBy: { basePrice: 'asc' },
  });

  if (defaultPlan) {
    await prisma.subscription.create({
      data: {
        restaurantId: restaurant.id,
        planId: defaultPlan.id,
        status: SubscriptionStatus.TRIAL,
        trialUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      },
    });
  }

  // Create the owner user
  const user = await prisma.user.create({
    data: {
      restaurantId: restaurant.id,
      fullName,
      email: invite.email,
      passwordHash,
      role: "OWNER",
      isActive: true,
      emailVerified: true, // Auto-verify since they came from an invite
    },
  });

  // Mark invite as accepted
  await prisma.ownerInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  // Generate tokens for automatic login
  const tokens = await generateTokens(user.id, restaurant.id, user.role);

  // Log the owner creation for audit purposes
  await createAuditLog({
    restaurantId: restaurant.id,
    userId: user.id,
    action: "OWNER_CREATED",
    entityType: "USER",
    entityId: user.id,
    details: `Owner ${user.fullName} created via invite acceptance`,
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
    },
  };
}
