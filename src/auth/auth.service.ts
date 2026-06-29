import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
    private firebase: FirebaseService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        username: dto.username,
        roles: dto.role ? (dto.role === 'USER' ? ['USER'] : ['USER', dto.role]) : ['USER'],
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        },
      },
      include: { profile: true },
    });

    const token = await this.signToken(user.id, user.email, user.roles);
    return { user: this.sanitize(user), access_token: token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = user.passwordHash
      ? await argon2.verify(user.passwordHash, dto.password)
      : false;
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = await this.signToken(user.id, user.email, user.roles);
    return { user: this.sanitize(user), access_token: token };
  }

  async loginWithFirebase(dto: FirebaseAuthDto) {
    const app = this.firebase.getApp();
    if (!app) throw new UnauthorizedException('Firebase not configured');

    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth(app).verifyIdToken(dto.idToken);
    } catch {
      throw new UnauthorizedException('Invalid Firebase token');
    }

    const { uid, email, name, firebase: fb } = decoded;
    if (!email) throw new BadRequestException('Email is required');

    const provider = (fb?.sign_in_provider ?? 'firebase') as string;

    // Determine social ID field based on provider
    const googleId = provider === 'google.com' ? uid : undefined;
    const appleId = provider === 'apple.com' ? uid : undefined;

    const [firstName, ...rest] = (name ?? '').split(' ');
    const lastName = rest.join(' ') || undefined;

    return this.findOrCreateSocialUser({
      email,
      googleId,
      appleId,
      firstName: firstName || undefined,
      lastName,
      provider,
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) return { message: 'Si el email existe, recibirás un código.' };

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await argon2.hash(code);
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetCode: codeHash, resetCodeExpiry: expiry },
    });

    try {
      await this.email.sendPasswordResetCode(user.email, code);
    } catch (err) {
      console.error('[Auth] Error sending reset email:', err?.message ?? err);
    }

    return { message: 'Si el email existe, recibirás un código.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user?.resetCode || !user.resetCodeExpiry) {
      throw new BadRequestException('Código inválido o expirado');
    }

    if (new Date() > user.resetCodeExpiry) {
      throw new BadRequestException('El código ha expirado');
    }

    const valid = await argon2.verify(user.resetCode, dto.code);
    if (!valid) throw new BadRequestException('Código incorrecto');

    const passwordHash = await argon2.hash(dto.newPassword);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetCode: null,
        resetCodeExpiry: null,
      },
      include: { profile: true },
    });

    const token = await this.signToken(updated.id, updated.email, updated.roles);
    return { user: this.sanitize(updated), access_token: token };
  }

  private async findOrCreateSocialUser(opts: {
    email: string;
    googleId?: string;
    appleId?: string;
    firstName?: string;
    lastName?: string;
    provider: string;
  }) {
    let user = opts.googleId
      ? await this.prisma.user.findUnique({ where: { googleId: opts.googleId }, include: { profile: true } })
      : opts.appleId
        ? await this.prisma.user.findUnique({ where: { appleId: opts.appleId }, include: { profile: true } })
        : null;

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: opts.email },
        include: { profile: true },
      });
    }

    if (user) {
      const updateData: Record<string, unknown> = {};
      if (opts.googleId && !user.googleId) updateData.googleId = opts.googleId;
      if (opts.appleId && !user.appleId) updateData.appleId = opts.appleId;
      if (!user.authProvider) updateData.authProvider = opts.provider;
      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
          include: { profile: true },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email: opts.email,
          authProvider: opts.provider,
          googleId: opts.googleId,
          appleId: opts.appleId,
          roles: ['USER', 'COMMUNITY_LEADER'],
          profile: {
            create: {
              firstName: opts.firstName,
              lastName: opts.lastName,
            },
          },
        },
        include: { profile: true },
      });
    }

    const accessToken = await this.signToken(user.id, user.email, user.roles);
    return { user: this.sanitize(user), access_token: accessToken };
  }

  private signToken(userId: string, email: string, roles: string[]) {
    return this.jwt.signAsync({ sub: userId, email, roles });
  }

  private sanitize(user: any) {
    const { passwordHash, resetCode, resetCodeExpiry, googleId, appleId, ...rest } = user;
    return rest;
  }
}
