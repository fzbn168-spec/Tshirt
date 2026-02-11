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

  /**
   * 用户注册 (B2B 公司入驻)
   * 
   * 逻辑说明:
   * 1. 检查邮箱是否已存在。
   * 2. 加密密码 (bcrypt)。
   * 3. 事务性创建: 同时创建 `Company` 和 `User` 记录。
   *    - 默认将注册用户设为该公司管理员 (ADMIN)。
   * 4. 发送欢迎通知。
   * 
   * @param registerDto 注册信息 (含公司名)
   */
  async register(registerDto: RegisterDto) {
    const { email, password, fullName, companyName } = registerDto;

    // 检查用户是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // 密码加密 (安全散列)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 事务性创建公司和用户
    // 注意: 在 B2B 场景中，通常是一个用户注册时创建一个公司账号。
    // 如果是邀请加入已存在的公司，应走邀请流程 (Invite Flow)，而不是此注册流程。
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 创建公司实体
      const company = await tx.company.create({
        data: {
          name: companyName,
          contactEmail: email, // 默认使用注册邮箱作为公司联系邮箱
        },
      });

      // 2. 创建初始管理员用户
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          fullName,
          companyId: company.id,
          role: 'ADMIN', // 首个用户默认为公司管理员
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

    // 发送系统欢迎通知
    await this.notificationsService.notifyUser(
      result.user.id,
      email,
      'SYSTEM',
      'Welcome to SoleTrade',
      EmailTemplates.welcome(fullName || 'User'),
    );

    return result;
  }

  /**
   * 用户登录 (JWT 签发)
   * 
   * 逻辑说明:
   * 1. 根据邮箱查找用户。
   * 2. 验证密码哈希。
   * 3. 签发 JWT 令牌 (包含 userId, role, companyId)。
   * 
   * @param loginDto 登录凭证
   */
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

    // 构建 JWT 载荷 (Payload)
    // 这些信息会被编码到 Token 中，前端解码后可直接使用
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
