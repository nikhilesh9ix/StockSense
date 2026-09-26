import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import { JWTPayload, TokenPair } from '../types';
import { UserRole } from '../constants';

export class AuthService {
  private generateTokens(payload: JWTPayload): TokenPair {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
    return { accessToken };
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<{ user: JWTPayload; tokens: TokenPair }> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('DUPLICATE_EMAIL', 'Email already exists', 409);
    }

    const passwordHash = await argon2.hash(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
      },
    });

    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const tokens = this.generateTokens(payload);

    return { user: payload, tokens };
  }

  async login(email: string, password: string): Promise<{ user: JWTPayload; tokens: TokenPair }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
    }

    const isValid = await argon2.verify(user.passwordHash, password);

    if (!isValid) {
      throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
    }

    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const tokens = this.generateTokens(payload);

    return { user: payload, tokens };
  }

  async getProfile(userId: string): Promise<JWTPayload> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }

    const isValid = await argon2.verify(user.passwordHash, currentPassword);

    if (!isValid) {
      throw new AppError('UNAUTHORIZED', 'Current password is incorrect', 401);
    }

    const passwordHash = await argon2.hash(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return 'OTP sent if email exists';
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // In a real app, store OTP in database or Redis
    // For now, we'll log it for development
    console.log(`[DEV] OTP for ${email}: ${otp}`);

    // TODO: Store OTP in database with expiry
    // await prisma.passwordResetToken.create({ data: { userId: user.id, token: otp, expiresAt: otpExpiry } });

    return 'OTP sent if email exists';
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }

    // TODO: Verify OTP from database
    // For development, accept any 6-digit OTP
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid OTP format', 400);
    }

    return true;
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }

    // TODO: Verify OTP from database
    // For development, accept any 6-digit OTP
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid OTP', 400);
    }

    const passwordHash = await argon2.hash(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // TODO: Delete used OTP from database
  }
}

export const authService = new AuthService();