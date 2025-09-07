import { Controller, Param, ParseIntPipe, Patch, Body, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UpdateServiceOrderDetailQuoteRequestDto } from './dto/update-service-order-detail-request.dto';
import { UpdateServiceOrderDetailResponseDto } from './dto/update-service-order-detail-response.dto';
import { ServiceOrderDetailsService } from './service-order-details.service';

import { Permissions } from '@/auth/decorators/permissions.decorator';
import { Permission } from '@/auth/decorators/permissions.enum';
import { BaseResponseDto } from '@/common/dtos/base-response.dto';

@ApiTags('Service-Order-Details-Technician')
@ApiBearerAuth()
@Controller('service-order-details')
export class TechnicianServiceOrderDetailsController {
  constructor(private readonly serviceOrderDetailsService: ServiceOrderDetailsService) {}

  @Patch(':id/quote')
  @Permissions(Permission.UpdateServiceOrderDetail, Permission.UpdateServiceOrder)
  @ApiOperation({ summary: 'Báo giá dịch vụ chưa bao gồm giá linh kiện nếu có' })
  @ApiParam({ name: 'id', description: 'ServiceOrderDetail ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Báo giá thành công',
    type: BaseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ServiceOrderDetail not found' })
  async quote(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: { user: { technicianId: number } },
    @Body() dto: UpdateServiceOrderDetailQuoteRequestDto,
  ): Promise<BaseResponseDto<UpdateServiceOrderDetailResponseDto>> {
    const technicianId = request.user.technicianId;
    const result = await this.serviceOrderDetailsService.quote(id, technicianId, dto);

    return {
      success: true,
      message: 'Báo giá thành công',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}
