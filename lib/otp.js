// lib/otp.js
import bcrypt from 'bcryptjs';

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashOTP(otp) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
}

export async function verifyOTP(plainOTP, hashedOTP) {
  return bcrypt.compare(plainOTP, hashedOTP);
}