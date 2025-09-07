import { Controller, Param, ParseIntPipe, Patch, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ServiceOrderResponseDto } from './dto/service-order-response.dto';
import { ServiceOrdersService } from './service-orders.service';

import { Permissions } from '@/auth/decorators/permissions.decorator';
import { Permission } from '@/auth/decorators/permissions.enum';

@ApiTags('Service-Orders-Admin')
@ApiBearerAuth()
@Controller('service-orders')
export class AdminServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Patch(':id/comfirm')
  @Permissions(Permission.UpdateServiceOrder, Permission.UpdateServiceOrderDetail, Permission.UpdateAppointment)
  @ApiOperation({ summary: 'Xác nhận đơn hàng khách đã đặt' })
  @ApiParam({ name: 'id', description: 'ServiceOrder ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Duyệt đơn hàng dịch vụ thành công',
    type: ServiceOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ServiceOrder not found' })
  async confirm(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: { user: { _id: number } },
  ): Promise<ServiceOrderResponseDto> {
    return await this.serviceOrdersService.adminConfirm(id, request.user._id); // need to check confirm the status of the appointment and update confirmed status for the ServiceOrderDetail
  }

  @Patch(':id/complete')
  @Permissions(Permission.UpdateServiceOrder)
  @ApiOperation({ summary: 'Quyết toán - hoàn thành đơn hàng dịch vụ' })
  @ApiParam({ name: 'id', description: 'ServiceOrder ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Duyệt hoàn thành đơn hàng dịch vụ thành công',
    type: ServiceOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ServiceOrder not found' })
  async complete(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: { user: { _id: number } },
  ): Promise<ServiceOrderResponseDto> {
    return await this.serviceOrdersService.adminComplete(id, request.user._id);
  }
  // @Get()
  // findAll() {
  //   return this.serviceOrdersService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.serviceOrdersService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateServiceOrderDto: UpdateServiceOrderDto) {
  //   return this.serviceOrdersService.update(+id, updateServiceOrderDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.serviceOrdersService.remove(+id);
  // }
}
