/**
 * Parent Auth Guard - Guard específico para autenticação de responsáveis
 * Referência: context7 mcp - NestJS Guards Pattern
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class ParentAuthGuard extends AuthGuard('jwt') implements CanActivate {
  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Primeiro, verificar se o token JWT é válido
    return super.canActivate(context) as boolean | Promise<boolean> | Observable<boolean>;
  }

  override handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Se há erro na validação do token
    if (err || !user) {
      throw err || new UnauthorizedException('Token de acesso inválido');
    }

    // Verificar se o usuário tem role PARENT
    if (user.role !== 'PARENT') {
      throw new ForbiddenException(
        'Acesso negado: Este endpoint é exclusivo para responsáveis',
      );
    }

    return user;
  }
}