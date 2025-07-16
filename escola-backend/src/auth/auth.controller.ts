/**
 * Auth Controller - Endpoints de autenticação
 * Referência: context7 mcp - Authentication Controller Pattern
 */
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginParentDto } from '../parents-portal/dto/login-parent.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuário' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Email ou senha inválidos',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return await this.authService.login(loginDto);
  }

  @Post('parent-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de responsável/pai' })
  @ApiBody({ type: LoginParentDto })
  @ApiResponse({
    status: 200,
    description: 'Login de responsável realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Email ou senha inválidos',
  })
  async parentLogin(@Body() loginParentDto: LoginParentDto): Promise<AuthResponseDto> {
    return await this.authService.parentLogin(loginParentDto);
  }
}