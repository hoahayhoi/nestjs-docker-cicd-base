import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreatePermissionRequestDto, PermissionResponseDto } from './dto/create-permission.dto';
import { PermissionsService } from './permissions.service';

import { Permissions } from '@/auth/decorators/permissions.decorator';
import { Permission } from '@/auth/decorators/permissions.enum';

@ApiBearerAuth()
@ApiTags('Permissions-Admin')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Permissions(Permission.CreatePermission)
  @ApiOperation({
    summary: 'Tạo quyền mới',
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
  async create(@Body() dto: CreatePermissionRequestDto): Promise<PermissionResponseDto> {
    return await this.permissionsService.create(dto);
  }

  @Get()
  @Permissions(Permission.ViewPermission)
  @ApiOperation({
    summary: 'Xem các quyền',
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
  async findAll(): Promise<PermissionResponseDto[]> {
    return await this.permissionsService.findAll();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.permissionsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
  //   return this.permissionsService.update(+id, updatePermissionDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.permissionsService.remove(+id);
  // }
}
