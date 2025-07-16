/**
 * Auth Service - Autenticação JWT
 * Referência: context7 mcp - JWT Authentication Pattern
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { LoginParentDto } from '../parents-portal/dto/login-parent.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import * as bcrypt from 'bcrypt';
import { User, Parent } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    
    const user = await this.validateUser(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async validateParent(email: string, password: string): Promise<Omit<Parent, 'password'> | null> {
    const parent = await this.prisma.parent.findUnique({
      where: { email },
    });
    
    if (!parent) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, parent.password);
    
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...parentWithoutPassword } = parent;
    return parentWithoutPassword;
  }

  async parentLogin(loginParentDto: LoginParentDto): Promise<AuthResponseDto> {
    const { email, password } = loginParentDto;
    
    const parent = await this.validateParent(email, password);
    
    if (!parent) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const payload: JwtPayload = {
      sub: parent.id,
      email: parent.email,
      role: 'PARENT',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: parent.id,
        name: parent.name,
        email: parent.email,
        role: 'PARENT',
      },
    };
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}