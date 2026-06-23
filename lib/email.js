// lib/email.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(email, otp, purpose) {
  try {
    const subjectMap = {
      SIGNUP_VERIFY: 'Verify your email',
      LOGIN_2FA: 'Your login code',
      PASSWORD_CHANGE: 'Reset your password',
      EMAIL_CHANGE_OLD: 'Confirm email change',
      EMAIL_CHANGE_NEW: 'Verify new email',
    };

    const subject = subjectMap[purpose] || 'Your verification code';

    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Your Verification Code</h1>
          <p style="color: #666; font-size: 16px;">Your one-time password is:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h2 style="font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 0; color: #0071e3;">${otp}</h2>
          </div>
          <p style="color: #999; font-size: 14px;">This code expires in 5 minutes.</p>
          <p style="color: #999; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">© 2026 TechMart. All rights reserved.</p>
        </div>
      `,
    });

    return result;
  } catch (error) {
    console.error('Send email error:', error);
    throw error;
  }
}

export async function sendOrderConfirmationEmail(email, order) {
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Order Confirmed!</h1>
          <p style="color: #666;">Thank you for your order. Here are your order details:</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Total:</strong> ₦${order.total.toLocaleString()}</p>
            <p><strong>Delivery Window:</strong> ${new Date(order.deliveryWindow.earliest).toLocaleDateString()} - ${new Date(order.deliveryWindow.latest).toLocaleDateString()}</p>
          </div>
          
          <p style="color: #666;">You can track your order using your order number.</p>
          <p style="color: #999; font-size: 12px;">© 2026 TechMart. All rights reserved.</p>
        </div>
      `,
    });

    return result;
  } catch (error) {
    console.error('Send order confirmation error:', error);
    throw error;
  }
}
