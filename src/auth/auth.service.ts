import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
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

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = await this.signToken(user.id, user.email, user.roles);
    return { user: this.sanitize(user), access_token: token };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always return success to avoid email enumeration
    if (!user) return { message: 'Si el email existe, recibirás un código.' };

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await argon2.hash(code);
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetCode: codeHash, resetCodeExpiry: expiry },
    });

    await this.email.sendPasswordResetCode(user.email, code);

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

  private signToken(userId: string, email: string, roles: string[]) {
    return this.jwt.signAsync({ sub: userId, email, roles });
  }

  private sanitize(user: any) {
    const { passwordHash, resetCode, resetCodeExpiry, ...rest } = user;
    return rest;
  }
}
