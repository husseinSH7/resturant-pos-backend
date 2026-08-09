import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Don't throw error - we don't want to block the flow if email fails
    return { success: false, error };
  }
}

export async function sendEmailVerificationEmail(email: string, verificationToken: string) {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify Your Email</h2>
          <p>Thank you for creating an account. Please verify your email address by clicking the link below:</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create this account, you can safely ignore this email.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { success: false, error };
  }
}

export async function sendOwnerInviteEmail(email: string, restaurantName: string, inviteToken: string) {
  const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${inviteToken}`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: `You're invited to join ${restaurantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You're Invited!</h2>
          <p>You have been invited to become the owner of <strong>${restaurantName}</strong> on our POS platform.</p>
          <p>Click the link below to accept the invitation and set up your account:</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Accept Invitation</a>
          <p>This link will expire in 7 days.</p>
          <p>If you don't want to join this restaurant, you can safely ignore this email.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send owner invite email:', error);
    return { success: false, error };
  }
}