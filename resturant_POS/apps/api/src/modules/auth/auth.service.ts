import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../../prisma.js";
import { createAuditLog } from "../../services/audit.service.js";

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

  // Store reset token - in production, use a separate passwordReset table
  // For now, we'll log it for development
  console.log(`Password reset token for ${email}: ${resetToken}`);
  
  // TODO: Send email with reset link using a transactional email service
  
  return { 
    message: "If the email exists, a reset link has been sent",
    resetToken // Only for development - remove in production
  };
}

export async function resetPassword(token: string, newPassword: string) {
  // In production, validate the token from a password reset table
  // For now, this is a simplified version that requires proper implementation
  
  // TODO: Implement proper token validation and password update
  // This requires adding passwordResetToken and passwordResetExpiry fields to the User model
  
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  
  // Placeholder - needs proper token storage implementation
  throw new Error("Password reset functionality requires proper token storage implementation in the database schema");
}

export async function verifyEmail(token: string) {
  // In production, validate the verification token and mark user as verified
  // This requires adding emailVerified and emailVerificationToken fields to the User model
  
  // TODO: Implement proper email verification
  console.log(`Email verification token: ${token}`);
  
  // Placeholder - needs proper token storage implementation
  throw new Error("Email verification functionality requires proper token storage implementation in the database schema");
}

export async function resendVerificationEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { message: "If the email exists, a verification link has been sent" };
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // TODO: Store token and send email
  console.log(`Verification token for ${email}: ${verificationToken}`);
  
  return { 
    message: "If the email exists, a verification link has been sent",
    verificationToken // Only for development
  };
}

export async function createOwnerInvite(email: string, restaurantName: string) {
  // Generate invite token
  const inviteToken = crypto.randomBytes(32).toString('hex');
  const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  // TODO: Store invite in database with email, token, expiry, restaurantName
  // For now, log for development
  console.log(`Owner invite token for ${email} (${restaurantName}): ${inviteToken}`);
  console.log(`Expires: ${inviteExpiry.toISOString()}`);

  const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${inviteToken}`;

  // TODO: Send email with invite link

  return {
    message: "Invite created successfully",
    inviteLink,
    inviteToken, // Only for development
    expiresAt: inviteExpiry,
  };
}

export async function acceptOwnerInvite(token: string, password: string, fullName: string) {
  // TODO: Validate invite token from database
  // Check if token exists, is not expired, and hasn't been used
  // Get email and restaurantName from invite record

  // For now, this is a placeholder
  throw new Error("Owner invite acceptance requires proper invite storage implementation in the database schema");
}
