import nodemailer from 'nodemailer';

// Prisma types
interface Booking {
  id: string;
  bookerName: string;
  bookerEmail: string;
  bookingDate: Date;
  startTime: string;
  endTime: string;
  timezone: string;
  notes: string | null;
  status: string;
  eventType?: EventType;
}

interface EventType {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  slug: string;
}

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Format date and time for email
const formatDateTime = (date: Date, time: string, timezone: string): string => {
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return `${dateStr} at ${time} ${timezone}`;
};

// Send booking confirmation email
export const sendBookingConfirmation = async (
  booking: Booking,
  eventType: EventType
): Promise<void> => {
  try {
    const transporter = createTransporter();

    const startDateTime = formatDateTime(
      booking.bookingDate,
      booking.startTime,
      booking.timezone
    );

    // Email HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 30px;
          }
          .info-box {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .info-row {
            display: flex;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: 600;
            color: #4b5563;
            min-width: 120px;
          }
          .info-value {
            color: #1f2937;
          }
          .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            background: #f9fafb;
          }
          .notes {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
          }
          @media only screen and (max-width: 600px) {
            body { padding: 10px; }
            .content { padding: 20px; }
            .header h1 { font-size: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Booking Confirmed!</h1>
          </div>
          
          <div class="content">
            <p>Hi <strong>${booking.bookerName}</strong>,</p>
            
            <p>Your meeting has been successfully scheduled. Here are the details:</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">📅 Event Type:</span>
                <span class="info-value">${eventType.title}</span>
              </div>
              <div class="info-row">
                <span class="info-label">🕒 Duration:</span>
                <span class="info-value">${eventType.duration} minutes</span>
              </div>
              <div class="info-row">
                <span class="info-label">📆 Date & Time:</span>
                <span class="info-value">${startDateTime}</span>
              </div>
              <div class="info-row">
                <span class="info-label">⏰ End Time:</span>
                <span class="info-value">${booking.endTime} ${booking.timezone}</span>
              </div>
              <div class="info-row">
                <span class="info-label">📧 Email:</span>
                <span class="info-value">${booking.bookerEmail}</span>
              </div>
              ${booking.notes ? `
              <div class="notes">
                <strong>📝 Notes:</strong><br>
                ${booking.notes}
              </div>
              ` : ''}
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Add this event to your calendar</li>
              <li>You'll receive a reminder before the meeting</li>
              <li>Join the meeting at the scheduled time</li>
            </ul>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings" class="button">
                View My Bookings
              </a>
            </center>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Need to cancel or reschedule? Contact us at 
              <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a>
            </p>
          </div>
          
          <div class="footer">
            <p>© 2026 Cal Clone. Built with ❤️</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version (fallback)
    const textContent = `
Booking Confirmed!

Hi ${booking.bookerName},

Your meeting has been successfully scheduled.

Event Type: ${eventType.title}
Duration: ${eventType.duration} minutes
Date & Time: ${startDateTime}
End Time: ${booking.endTime} ${booking.timezone}
Email: ${booking.bookerEmail}
${booking.notes ? `\nNotes: ${booking.notes}` : ''}

View your bookings: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings

Need help? Contact us at ${process.env.EMAIL_USER}

© 2026 Cal Clone
    `;

    // Send email
    await transporter.sendMail({
      from: `"Cal Clone" <${process.env.EMAIL_USER}>`,
      to: booking.bookerEmail,
      subject: `✅ Booking Confirmed - ${eventType.title}`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`✅ Confirmation email sent to ${booking.bookerEmail}`);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error; // Re-throw so caller knows it failed
  }
};

// Send cancellation email
export const sendCancellationEmail = async (
  booking: Booking,
  eventType: EventType
): Promise<void> => {
  try {
    const transporter = createTransporter();

    const startDateTime = formatDateTime(
      booking.bookingDate,
      booking.startTime,
      booking.timezone
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
          .container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: #ef4444; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .info-box { background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Booking Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${booking.bookerName}</strong>,</p>
            <p>Your booking has been cancelled:</p>
            <div class="info-box">
              <strong>Event:</strong> ${eventType.title}<br>
              <strong>Date & Time:</strong> ${startDateTime}<br>
              <strong>Duration:</strong> ${eventType.duration} minutes
            </div>
            <p>If you'd like to reschedule, please visit our booking page.</p>
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/event-types" class="button">
                Book Another Meeting
              </a>
            </center>
          </div>
          <div class="footer">
            <p>© 2026 Cal Clone</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Cal Clone" <${process.env.EMAIL_USER}>`,
      to: booking.bookerEmail,
      subject: `❌ Booking Cancelled - ${eventType.title}`,
      html: htmlContent,
    });

    console.log(`✅ Cancellation email sent to ${booking.bookerEmail}`);
  } catch (error) {
    console.error('❌ Failed to send cancellation email:', error);
    throw error;
  }
};
