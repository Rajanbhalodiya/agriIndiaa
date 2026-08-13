import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTPEmail = async (email, otp) => {
  try {
    const sender = process.env.SENDER_EMAIL || process.env.SMTP_USER || 'support@agriindia.com';
    const mailOptions = {
      from: `"AgriIndia Support" <${sender}>`,
      to: email,
      subject: 'AgriIndia - Password Reset OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #16a34a; text-align: center;">AgriIndia Verification Code</h2>
          <p style="font-size: 15px; color: #333;">Your OTP verification code for resetting your password is:</p>
          <div style="text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #16a34a; letter-spacing: 5px; padding: 10px 20px; background: #f0fdf4; border: 1px border-dashed #16a34a; border-radius: 8px;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 13px; color: #666;">This code is valid for 5 minutes. If you did not request this code, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`[Nodemailer] OTP email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('[Nodemailer Error]: Failed to send OTP email:', error.message);
    // Fallback log in case SMTP credentials are not configured
    console.log(`[Fallback OTP for ${email}]: ${otp}`);
    return { success: false, error: error.message };
  }
};

export default transporter;
