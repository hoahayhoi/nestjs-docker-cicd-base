import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthService } from '@/auth/auth.service';
import { PERMISSIONS_KEY } from '@/auth/decorators/permissions.decorator';
import { ROLES_KEY } from '@/auth/decorators/roles.decorator';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    const requiredPermissions = this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler());

    // Nếu không yêu cầu gì thì cho phép truy cập
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: { _id: number } }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // 2. Nếu không có permission trực tiếp, kiểm tra qua role
    const userRoles = await this.authService.getUserRoles(user._id);
    const rolePermissions = await this.authService.getPermissionsForRoles(userRoles.map((role) => role.role_id));

    // Kiểm tra permissions (PHẢI CÓ TẤT CẢ)
    const hasAllPermissions = requiredPermissions.every((perm) => rolePermissions.includes(perm));

    if (!hasAllPermissions) {
      throw new ForbiddenException(`Requires ALL permissions: ${requiredPermissions.join(', ')}`);
    }

    return true;
  }
}
