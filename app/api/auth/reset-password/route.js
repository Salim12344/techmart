

// app/api/auth/reset-password/route.js
import { connectDB } from '@/lib/db';
import User from '@/models/user';
import OTPToken from '@/models/OTPToken';
import { verifyOTP } from '@/lib/otp';

export async function POST(req) {
  try {
    await connectDB();
    
    const { otpTokenId, otp, newPassword, confirmPassword } = await req.json();

    if (!otpTokenId || !otp || !newPassword || !confirmPassword) {
      return Response.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return Response.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return Response.json(
        { 
          success: false, 
          error: 'Password must be at least 8 characters with uppercase, number, and special character' 
        },
        { status: 400 }
      );
    }

    // Find OTP token
    const otpToken = await OTPToken.findById(otpTokenId);
    if (!otpToken) {
      return Response.json(
        { success: false, error: 'OTP token not found' },
        { status: 404 }
      );
    }

    // Check if purpose is PASSWORD_CHANGE
    if (otpToken.purpose !== 'PASSWORD_CHANGE') {
      return Response.json(
        { success: false, error: 'Invalid OTP token' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > otpToken.expiresAt) {
      return Response.json(
        { success: false, error: 'Code expired. Request a new one.' },
        { status: 400 }
      );
    }

    // Check if already used
    if (otpToken.used) {
      return Response.json(
        { success: false, error: 'Code already used' },
        { status: 400 }
      );
    }

    // Check if locked due to too many attempts
    if (otpToken.lockedUntil && new Date() < otpToken.lockedUntil) {
      const minutesLeft = Math.ceil((otpToken.lockedUntil - new Date()) / 60000);
      return Response.json(
        { success: false, error: `Too many attempts. Try again in ${minutesLeft} minutes.` },
        { status: 429 }
      );
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, otpToken.otpHash);
    if (!isValid) {
      otpToken.attempts += 1;
      
      if (otpToken.attempts >= 3) {
        otpToken.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      
      await otpToken.save();
      
      return Response.json(
        { success: false, error: `Invalid code. ${3 - otpToken.attempts} attempts remaining.` },
        { status: 400 }
      );
    }

    // Mark OTP as used
    otpToken.used = true;
    await otpToken.save();

    const user = await User.findByIdAndUpdate(
      otpToken.userId,
      { password: newPassword },
      { new: true }
    );

    return Response.json(
      {
        success: true,
        message: 'Password reset successful. Please log in with your new password.',
        email: user.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
