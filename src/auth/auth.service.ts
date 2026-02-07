import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
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
        role: dto.role ?? 'USER',
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        },
      },
      include: { profile: true },
    });

    const token = await this.signToken(user.id, user.email, user.role);
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

    const token = await this.signToken(user.id, user.email, user.role);
    return { user: this.sanitize(user), access_token: token };
  }

  private signToken(userId: string, email: string, role: string) {
    return this.jwt.signAsync({ sub: userId, email, role });
  }

  private sanitize(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
