/**
 * JWT Auth Guard - Proteção de rotas com JWT
 * Referência: context7 mcp - NestJS Guards Pattern
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}