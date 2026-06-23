// app/api/auth/register/route.js
import { connectDB } from '@/lib/db';
import User from '@/models/user';
import OTPToken from '@/models/OTPToken';
import { verifyOTP } from '@/lib/otp';

export async function POST(req) {
  try {
    await connectDB();
    const { name, email, phone, password, otp, otpTokenId } = await req.json();

    if (!name || !email || !phone || !password || !otp || !otpTokenId) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if email already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return Response.json({ error: 'This email is already registered. Try logging in instead.' }, { status: 409 });
    }

    // Find OTP token
    const otpToken = await OTPToken.findById(otpTokenId);
    if (!otpToken) {
      return Response.json({ error: 'Verification code not found. Please request a new one.' }, { status: 400 });
    }

    // Check expired
    if (new Date() > otpToken.expiresAt) {
      await OTPToken.findByIdAndDelete(otpTokenId);
      return Response.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
    }

    // Check already used
    if (otpToken.used) {
      return Response.json({ error: 'Verification code has already been used.' }, { status: 400 });
    }

    // Check locked
    if (otpToken.lockedUntil && new Date() < otpToken.lockedUntil) {
      const minutesLeft = Math.ceil((otpToken.lockedUntil - new Date()) / 60000);
      return Response.json({ error: `Too many attempts. Try again in ${minutesLeft} minute(s).` }, { status: 429 });
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, otpToken.otpHash);
    if (!isValid) {
      otpToken.attempts += 1;
      if (otpToken.attempts >= 5) {
        otpToken.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await otpToken.save();
        return Response.json({ error: 'Too many failed attempts. Try again in 15 minutes.' }, { status: 429 });
      }
      await otpToken.save();
      return Response.json({ error: `Incorrect code. ${5 - otpToken.attempts} attempt(s) remaining.` }, { status: 400 });
    }

    // Mark OTP as used
    otpToken.used = true;
    await otpToken.save();

    // Create user — plain text password, no hashing
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: password,
      role: 'user',
      emailVerified: true,
    });

    return Response.json({
      success: true,
      message: 'Account created successfully',
      userId: user._id,
    }, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
