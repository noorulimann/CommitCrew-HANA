/**
 * Email Service
 * 
 * Sends OTP verification emails using Nodemailer
 * Used for the Identity Gateway email verification flow
 */

import nodemailer from 'nodemailer';
import { CONFIG } from '@/lib/config';

/**
 * Email transporter configuration
 * Uses SMTP settings from environment variables
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: CONFIG.SMTP.host,
    port: CONFIG.SMTP.port,
    secure: CONFIG.SMTP.port === 465, // true for 465, false for other ports
    auth: {
      user: CONFIG.SMTP.user,
      pass: CONFIG.SMTP.password,
    },
  });
}

/**
 * OTP Email template
 */
function generateOTPEmailHTML(otpCode: string, expiryMinutes: number): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Citadel of Truth - Email Verification</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
            🏰 Citadel of Truth
          </h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">
            Email Verification
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px;">
          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Welcome! Use the code below to verify your email address:
          </p>
          
          <!-- OTP Code Box -->
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">
              ${otpCode}
            </span>
          </div>
          
          <!-- Expiry Warning -->
          <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0; text-align: center;">
            ⏱️ This code expires in <strong>${expiryMinutes} minutes</strong>
          </p>
          
          <!-- Security Notice -->
          <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; font-size: 13px; line-height: 1.5; margin: 0;">
              <strong>🔒 Security Notice:</strong> Never share this code with anyone. 
              Citadel of Truth will never ask for your password or secret phrase via email.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
}

/**
 * Plain text version of OTP email
 */
function generateOTPEmailText(otpCode: string, expiryMinutes: number): string {
  return `
Citadel of Truth - Email Verification

Your verification code is: ${otpCode}

This code expires in ${expiryMinutes} minutes.

SECURITY NOTICE: Never share this code with anyone. 
Citadel of Truth will never ask for your password or secret phrase via email.

If you didn't request this code, you can safely ignore this email.
  `.trim();
}

/**
 * Send OTP verification email
 * @param email - Recipient email address
 * @param otpCode - The 6-digit OTP code
 * @param expiryMinutes - Minutes until OTP expires
 * @returns Promise with send result
 */
export async function sendOTPEmail(
  email: string,
  otpCode: string,
  expiryMinutes: number = 5
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // Check if email service is configured
    if (!CONFIG.SMTP.user || !CONFIG.SMTP.password) {
      console.warn('Email service not configured. OTP:', otpCode);
      
      // In development, we'll just log the OTP
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] OTP for ${email}: ${otpCode}`);
        return { 
          success: true, 
          messageId: 'dev-mode-no-email',
        };
      }
      
      return { 
        success: false, 
        error: 'Email service not configured' 
      };
    }
    
    const transporter = createTransporter();
    
    // Verify SMTP connection
    console.log('[Email] Verifying SMTP connection...');
    try {
      await transporter.verify();
      console.log('[Email] SMTP verified successfully');
    } catch (verifyError) {
      console.error('[Email] SMTP verification failed:', verifyError);
      throw new Error(`SMTP verification failed: ${verifyError}`);
    }
    
    const mailOptions = {
      from: `"Citadel of Truth" <${CONFIG.SMTP.from}>`,
      to: email,
      subject: '🏰 Your Verification Code - Citadel of Truth',
      text: generateOTPEmailText(otpCode, expiryMinutes),
      html: generateOTPEmailHTML(otpCode, expiryMinutes),
    };
    
    console.log('[Email] Sending OTP to:', email);
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] OTP sent successfully. Message ID:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId 
    };
    
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

/**
 * Verify email service configuration
 * @returns Promise<boolean> - Whether the email service is properly configured
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    if (!CONFIG.SMTP.user || !CONFIG.SMTP.password) {
      return false;
    }
    
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}

const emailService = {
  sendOTPEmail,
  verifyEmailConfig,
};

export default emailService;
