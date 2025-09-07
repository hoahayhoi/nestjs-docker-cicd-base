import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

import { AddPermissionsToRoleResponseDto, CreateRoleRequestDto, RoleResponseDto } from './dto/create-role.dto';

import { DatabaseService } from '@/database/database.service';
import { RolePermissionsResponseDto } from '@/permissions/dto/create-permission.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: DatabaseService) {}
  async create(dto: CreateRoleRequestDto): Promise<RoleResponseDto> {
    const role = await this.prisma.role.create({
      data: {
        role_name: dto.name,
        description: dto.description,
      },
      include: {
        permissions: true,
      },
    });

    return {
      id: role.id,
      name: role.role_name,
      description: role.description,
    };
  }

  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: true, // Nếu bạn muốn bao gồm cả permissions
      },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.role_name,
      description: role.description,
    }));
  }

  /**
   * Thêm danh sách quyền (permissions) vào một vai trò (role) cụ thể.
   *
   * @param roleId - ID của vai trò cần thêm quyền.
   * @param permissionIds - Danh sách ID của các quyền cần thêm vào vai trò.
   * @returns Một đối tượng `AddPermissionsToRoleResponseDto` chứa thông tin vai trò và các quyền đã được gán,
   * hoặc `null` nếu không thể cập nhật vai trò.
   *
   * @throws `NotFoundException` - Nếu vai trò không tồn tại hoặc một hoặc nhiều quyền không tồn tại.
   * @throws `InternalServerErrorException` - Nếu không thể cập nhật vai trò sau khi thêm quyền.
   */
  async addPermissions(roleId: number, permissionIds: number[]): Promise<AddPermissionsToRoleResponseDto> {
    // Kiểm tra role tồn tại
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Kiểm tra tất cả permission có tồn tại không
    const existingPermissions = await this.prisma.permission.findMany({
      where: {
        id: { in: permissionIds },
      },
    });

    if (existingPermissions.length !== permissionIds.length) {
      const missingIds = permissionIds.filter((id) => !existingPermissions.some((p) => p.id === id));

      throw new NotFoundException(`Permissions not found: ${missingIds.join(', ')}`);
    }

    // Thêm các permission vào role thông qua bảng RolePermission
    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        role_id: roleId,
        permission_id: permissionId,
      })),
      skipDuplicates: true, // tránh thêm lại các cặp đã tồn tại
    });

    // Truy vấn lại role và các permission đã gán (join qua RolePermission)
    const updatedRole = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!updatedRole) {
      throw new InternalServerErrorException('Can not update Role');
    }

    return {
      id: updatedRole.id,
      name: updatedRole.role_name,
      description: updatedRole.description,
      permissions:
        updatedRole.permissions?.map((rolePermission) => ({
          id: rolePermission.permission_id,
          permission_name: rolePermission.permission.permission_name,
          description: rolePermission.permission.description,
        })) || [],
    };
  }

  async getRolePermissions(roleId: number): Promise<RolePermissionsResponseDto> {
    // Kiểm tra và lấy thông tin role cùng với permissions
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          select: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Map dữ liệu từ Prisma sang DTO
    return {
      id: role.id,
      name: role.role_name,
      description: role.description,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        permission_name: rp.permission.permission_name,
        description: rp.permission.description,
      })),
    };
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} role`;
  // }

  // update(id: number, updateRoleDto: UpdateRoleDto) {
  //   return `This action updates a #${id} role`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} role`;
  // }
}
