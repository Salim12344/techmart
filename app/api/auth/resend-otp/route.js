// app/api/auth/resend-otp/route.js
import { connectDB } from '@/lib/db';
import OTPToken from '@/models/OTPToken';
import { generateOTP, hashOTP } from '@/lib/otp';
import { sendOTPEmail } from '@/lib/email';

export async function POST(req) {
  try {
    await connectDB();
    
    const { otpTokenId } = await req.json();

    if (!otpTokenId) {
      return Response.json(
        { success: false, error: 'OTP token is required' },
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

    // Check rate limit: max 3 requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (otpToken.lastRequestAt > oneHourAgo) {
      if (otpToken.requestCount >= 3) {
        const minutesLeft = Math.ceil((otpToken.lastRequestAt.getTime() + 60 * 60 * 1000 - Date.now()) / 60000);
        return Response.json(
          { success: false, error: `Too many requests. Try again in ${minutesLeft} minutes.` },
          { status: 429 }
        );
      }
    } else {
      // Reset request count if more than 1 hour has passed
      otpToken.requestCount = 0;
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    // Update OTP token
    otpToken.otpHash = otpHash;
    otpToken.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    otpToken.used = false;
    otpToken.attempts = 0;
    otpToken.lockedUntil = null;
    otpToken.requestCount += 1;
    otpToken.lastRequestAt = new Date();
    
    await otpToken.save();

    // Send OTP email
    await sendOTPEmail(otpToken.email, otp, otpToken.purpose);

    return Response.json(
      {
        success: true,
        message: 'New OTP sent. Check your email.',
        otpTokenId: otpToken._id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend OTP error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
