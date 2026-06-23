
// app/api/auth/verify-2fa/route.js
import { connectDB } from '@/lib/db';
import User from '@/models/user';
import OTPToken from '@/models/OTPToken';
import { verifyOTP } from '@/lib/otp';

export async function POST(req) {
  try {
    await connectDB();
    
    const { otpTokenId, otp } = await req.json();

    if (!otpTokenId || !otp) {
      return Response.json(
        { success: false, error: 'OTP token and code are required' },
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

    // Check if purpose is LOGIN_2FA
    if (otpToken.purpose !== 'LOGIN_2FA') {
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

    // Get user
    const user = await User.findById(otpToken.userId);

    return Response.json(
      {
        success: true,
        message: '2FA verification successful',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA verification error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
