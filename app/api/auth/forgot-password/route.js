// app/api/auth/forgot-password/route.js
import { connectDB } from '@/lib/db';
import User from '@/models/user';
import OTPToken from '@/models/OTPToken';
import { generateOTP, hashOTP } from '@/lib/otp';
import { sendOTPEmail } from '@/lib/email';

export async function POST(req) {
  try {
    await connectDB();
    
    const { email } = await req.json();

    if (!email) {
      return Response.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user (don't reveal if email exists or not)
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return generic message
    const genericMessage = 'If an account exists with that email, you\'ll receive a reset code.';

    if (!user) {
      return Response.json(
        { success: true, message: genericMessage },
        { status: 200 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const otpToken = await OTPToken.create({
      userId: user._id,
      email: user.email,
      otpHash,
      purpose: 'PASSWORD_CHANGE',
      expiresAt,
    });

    // Send OTP email
    await sendOTPEmail(user.email, otp, 'PASSWORD_CHANGE');

    return Response.json(
      {
        success: true,
        message: genericMessage,
        otpTokenId: otpToken._id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
