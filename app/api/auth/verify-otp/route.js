

// app/api/auth/verify-otp/route.js
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

    // Mark user as active (account verified)
    const user = await User.findByIdAndUpdate(otpToken.userId, { isActive: true }, { new: true });

    return Response.json(
      {
        success: true,
        message: 'Email verified successfully. You can now log in.',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP verification error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
