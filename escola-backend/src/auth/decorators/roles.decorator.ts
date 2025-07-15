/**
 * Roles Decorator - Define roles permitidos para acessar rotas
 * Referência: context7 mcp - Custom Decorators Pattern
 */
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);