import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailTemplates } from '../email/email.templates';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName, companyName } = registerDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Company and User transactionally
    // Note: For simplicity, we create a new company for every registration here.
    // In a real B2B app, you might want to join an existing company or verify company details.
    // Here we assume self-service registration creates a new company account.

    // We need to ensure company contact email is unique too if we use it for company lookup,
    // but here we just create a company.

    // Using transaction to ensure both created or neither
    const result = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          contactEmail: email, // Use user email as company contact email for now
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          fullName,
          companyId: company.id,
          role: 'ADMIN', // First user is Admin
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        company: {
          id: company.id,
          name: company.name,
        },
      };
    });

    // Send Welcome Notification
    await this.notificationsService.notifyUser(
      result.user.id,
      email,
      'SYSTEM',
      'Welcome to SoleTrade',
      EmailTemplates.welcome(fullName || 'User'),
    );

    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        company: user.company
          ? {
              id: user.company.id,
              name: user.company.name,
            }
          : null,
      },
    };
  }
}
