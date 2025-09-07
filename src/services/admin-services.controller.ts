import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateServiceDto, ServiceResponse } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

import { Permissions } from '@/auth/decorators/permissions.decorator';
import { Permission } from '@/auth/decorators/permissions.enum';

@ApiTags('Services-Admin')
@ApiBearerAuth()
@Controller('services')
export class AdminServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Permissions(Permission.CreateServices)
  @ApiOperation({
    summary: 'Tạo mới service',
  })
  @ApiResponse({
    status: 200,
    description: 'Tạo mới service thành công',
    type: ServiceResponse,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Không có quyền thực hiện',
  })
  async create(@Body() dto: CreateServiceDto): Promise<ServiceResponse> {
    return this.servicesService.create(dto);
  }

  @Patch(':id')
  @Permissions(Permission.UpdateServices)
  @ApiOperation({
    summary: 'Cập nhật thông tin dịch vụ',
    description: 'Cập nhật thông tin cơ bản và quản lý hình ảnh của dịch vụ',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của dịch vụ cần cập nhật',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật dịch vụ thành công',
    type: ServiceResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Không có quyền thực hiện',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy dịch vụ hoặc danh mục',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<ServiceResponse> {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @Permissions(Permission.DeleteServices)
  @ApiOperation({
    summary: 'Xóa dịch vụ',
    description: 'Xóa dịch vụ và tất cả hình ảnh liên quan',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của dịch vụ cần xóa',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa dịch vụ thành công',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Không có quyền thực hiện',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy dịch vụ',
  })
  @ApiResponse({
    status: 409,
    description: 'Xung đột - Dịch vụ đang được sử dụng',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    return this.servicesService.remove(id);
  }
}
