// app/api/auth/send-otp/route.js
import { connectDB } from '@/lib/db';
import { generateOTP, hashOTP } from '@/lib/otp';
import { sendOTPEmail } from '@/lib/email';
import OTPToken from '@/models/OTPToken';

const MAX_REQUESTS_PER_HOUR = 5;

export async function POST(req) {
  try {
    await connectDB();
    const { email, purpose } = await req.json();

    if (!email || !purpose) {
      return Response.json({ error: 'Email and purpose required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Check rate limiting — max 5 requests per hour
    const recentTokens = await OTPToken.find({
      email: normalizedEmail,
      purpose,
      lastRequestAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });

    if (recentTokens.length >= MAX_REQUESTS_PER_HOUR) {
      return Response.json(
        { error: 'Too many requests. Please wait before requesting another code.' },
        { status: 429 }
      );
    }

    // Delete any existing unused OTPs for this email + purpose
    await OTPToken.deleteMany({ email: normalizedEmail, purpose, used: false });

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const otpToken = await OTPToken.create({
      email: normalizedEmail,
      otpHash,
      purpose,
      expiresAt,
      lastRequestAt: new Date(),
    });

    await sendOTPEmail(email, otp, purpose);

    return Response.json({
      success: true,
      message: 'Verification code sent to your email',
      otpTokenId: otpToken._id,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
