import { Body, Controller, Param, ParseIntPipe, Patch, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  ServiceOrderPaymentStatusResponse,
  UpdateServiceOrderPaymentStatusRequest,
} from './dto/update-service-order.dto';
import { ServiceOrdersService } from './service-orders.service';

import { Permissions } from '@/auth/decorators/permissions.decorator';
import { Permission } from '@/auth/decorators/permissions.enum';

@ApiTags('Service-Orders-Technician')
@ApiBearerAuth()
@Controller('service-orders')
export class TechnicianServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Patch(':id/confirm-paid')
  @Permissions(Permission.UpdateServiceOrder)
  @ApiOperation({ summary: 'Xác nhận khách hàng đã thanh toán đơn hàng chứa lịch hẹn' })
  @ApiParam({ name: 'id', description: 'ServiceOrder ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật đơn hàng đã được thanh toán thành cộng',
    type: ServiceOrderPaymentStatusResponse,
  })
  @ApiResponse({ status: 404, description: 'Serivice order not found' })
  async technicianUpdatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: { user: { technicianId: number } },
    @Body() dto: UpdateServiceOrderPaymentStatusRequest,
  ): Promise<ServiceOrderPaymentStatusResponse> {
    const technicianId = request.user.technicianId;

    return await this.serviceOrdersService.technicianUpdatePaymentStatus(id, technicianId, dto);
  }
}
