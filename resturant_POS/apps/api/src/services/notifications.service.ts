import { createAuditLog } from "./audit.service.js";

// Mock notification service - in production, integrate with actual SMS/email providers
// like Twilio for SMS and SendGrid/Mailgun for email

export interface NotificationConfig {
  smsEnabled: boolean;
  emailEnabled: boolean;
  smsProvider?: 'twilio' | 'aws-sns';
  emailProvider?: 'sendgrid' | 'mailgun' | 'aws-ses';
}

export async function sendSMSNotification(
  phoneNumber: string,
  message: string,
  config?: NotificationConfig
) {
  // In production, integrate with actual SMS provider
  // For now, log the notification
  console.log(`[SMS Mock] To: ${phoneNumber}, Message: ${message}`);
  
  // Example Twilio integration (commented out):
  // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  // await client.messages.create({
  //   to: phoneNumber,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   body: message,
  // });

  return { success: true, provider: 'mock', message: 'SMS notification sent (mock)' };
}

export async function sendEmailNotification(
  email: string,
  subject: string,
  htmlBody: string,
  textBody?: string,
  config?: NotificationConfig
) {
  // In production, integrate with actual email provider
  // For now, log the notification
  console.log(`[Email Mock] To: ${email}, Subject: ${subject}`);
  
  // Example SendGrid integration (commented out):
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: email,
  //   from: process.env.FROM_EMAIL,
  //   subject: subject,
  //   text: textBody,
  //   html: htmlBody,
  // });

  return { success: true, provider: 'mock', message: 'Email notification sent (mock)' };
}

export async function sendReservationConfirmation(
  restaurantId: string,
  reservation: {
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    date: Date;
    time: Date;
    guestCount: number;
    tableId?: string;
  },
  restaurantName: string
) {
  const notifications = [];

  // Send SMS confirmation
  if (reservation.customerPhone) {
    const smsMessage = `Hi ${reservation.customerName}, your reservation at ${restaurantName} for ${reservation.guestCount} guests on ${reservation.date.toLocaleDateString()} at ${reservation.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} is confirmed. Reply CANCEL to cancel.`;
    
    try {
      const smsResult = await sendSMSNotification(reservation.customerPhone, smsMessage);
      notifications.push({ type: 'sms', success: true, result: smsResult });
    } catch (error: any) {
      notifications.push({ type: 'sms', success: false, error: error?.message || 'Unknown error' });
    }
  }

  // Send email confirmation
  if (reservation.customerEmail) {
    const subject = `Reservation Confirmation - ${restaurantName}`;
    const htmlBody = `
      <h2>Reservation Confirmed</h2>
      <p>Hi ${reservation.customerName},</p>
      <p>Your reservation at <strong>${restaurantName}</strong> is confirmed:</p>
      <ul>
        <li><strong>Date:</strong> ${reservation.date.toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${reservation.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</li>
        <li><strong>Guests:</strong> ${reservation.guestCount}</li>
      </ul>
      <p>Please arrive 5-10 minutes early. If you need to cancel, please reply to this email or call us.</p>
      <p>We look forward to seeing you!</p>
    `;
    const textBody = `Reservation Confirmed at ${restaurantName}\nDate: ${reservation.date.toLocaleDateString()}\nTime: ${reservation.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\nGuests: ${reservation.guestCount}\n\nPlease arrive 5-10 minutes early.`;
    
    try {
      const emailResult = await sendEmailNotification(reservation.customerEmail, subject, htmlBody, textBody);
      notifications.push({ type: 'email', success: true, result: emailResult });
    } catch (error: any) {
      notifications.push({ type: 'email', success: false, error: error?.message || 'Unknown error' });
    }
  }

  return notifications;
}

export async function sendReservationReminder(
  restaurantId: string,
  reservation: {
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    date: Date;
    time: Date;
    guestCount: number;
  },
  restaurantName: string
) {
  const notifications = [];

  // Send SMS reminder
  if (reservation.customerPhone) {
    const smsMessage = `Reminder: Your reservation at ${restaurantName} is tomorrow at ${reservation.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} for ${reservation.guestCount} guests. See you soon!`;
    
    try {
      const smsResult = await sendSMSNotification(reservation.customerPhone, smsMessage);
      notifications.push({ type: 'sms', success: true, result: smsResult });
    } catch (error: any) {
      notifications.push({ type: 'sms', success: false, error: error?.message || 'Unknown error' });
    }
  }

  return notifications;
}

export async function sendWaitlistNotification(
  restaurantId: string,
  entry: {
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    estimatedWait: number;
  },
  restaurantName: string
) {
  const notifications = [];

  // Send SMS notification
  if (entry.customerPhone) {
    const smsMessage = `Hi ${entry.customerName}, your table at ${restaurantName} is almost ready! Estimated wait: ${entry.estimatedWait} minutes. Please head to the restaurant.`;
    
    try {
      const smsResult = await sendSMSNotification(entry.customerPhone, smsMessage);
      notifications.push({ type: 'sms', success: true, result: smsResult });
    } catch (error: any) {
      notifications.push({ type: 'sms', success: false, error: error?.message || 'Unknown error' });
    }
  }

  return notifications;
}
