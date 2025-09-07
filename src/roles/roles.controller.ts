import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import {
  AddPermissionsToRoleRequestDto,
  AddPermissionsToRoleResponseDto,
  CreateRoleRequestDto,
  RoleResponseDto,
} from './dto/create-role.dto';
import { RolesService } from './roles.service';

import { Permissions } from '@/auth/decorators/permissions.decorator';
import { Permission } from '@/auth/decorators/permissions.enum';
import { PermissionResponseDto, RolePermissionsResponseDto } from '@/permissions/dto/create-permission.dto';

@ApiBearerAuth()
@ApiTags('Roles-Admin')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions(Permission.CreateRole)
  @ApiOperation({
    summary: 'Tạo vai trò',
  })
  @ApiResponse({
    status: 200,
    description: 'Tạo thành công',
    type: PermissionResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Không có quyền thực hiện',
  })
  async create(@Body() createRoleDto: CreateRoleRequestDto): Promise<RoleResponseDto> {
    return await this.rolesService.create(createRoleDto);
  }

  @Get()
  @Permissions(Permission.ViewRole)
  @ApiOperation({
    summary: 'Xem các vai trò',
  })
  @ApiResponse({
    status: 200,
    description: 'Xem thành công',
    type: PermissionResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Không có quyền thực hiện',
  })
  async findAll(): Promise<Partial<Role>[]> {
    return await this.rolesService.findAll();
  }

  @Post(':id/permissions')
  @Permissions(Permission.UpdateRole)
  @ApiOperation({
    summary: 'Thêm các quyền vào vai trò',
  })
  @ApiResponse({
    status: 200,
    description: 'Thêm các quyền thành công',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Không có quyền thực hiện',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy role hoặc permission',
  })
  async addPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() addPermissionsDto: AddPermissionsToRoleRequestDto,
  ): Promise<AddPermissionsToRoleResponseDto> {
    return await this.rolesService.addPermissions(id, addPermissionsDto.permissionIds);
  }

  @Get(':id/permissions')
  @Permissions(Permission.ViewRole) // Sử dụng permission phù hợp
  @ApiOperation({
    summary: 'Xem danh sách quyền của một vai trò',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách quyền thành công',
    type: RolePermissionsResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Không có quyền thực hiện',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy vai trò',
  })
  async getRolePermissions(@Param('id', ParseIntPipe) id: number): Promise<RolePermissionsResponseDto> {
    return await this.rolesService.getRolePermissions(id);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.rolesService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
  //   return this.rolesService.update(+id, updateRoleDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.rolesService.remove(+id);
  // }
}
