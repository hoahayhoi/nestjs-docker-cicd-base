import { Controller, Post, Body, Request, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { ServiceOrderItemHistoryResponseDto } from './dto/service-order-response.dto';
import { ServiceOrdersService } from './service-orders.service';

import { Permissions } from '@/auth/decorators/permissions.decorator';
import { Permission } from '@/auth/decorators/permissions.enum';
import { ReqWithContext } from '@/common/decorator/request-context.decorator';
import { RequestWithContext } from '@/common/interceptors/request.interface';

@ApiTags('Service-Orders-Customer')
@ApiBearerAuth()
@Controller('service-orders')
export class CustomerServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @ApiOperation({ summary: 'Tạo đơn hàng dịch vụ' })
  @Post()
  async create(
    @Body() createServiceOrderDto: CreateServiceOrderDto,
    @Request() reqest: { user: { _id: number } },
    @ReqWithContext() reqContext: RequestWithContext,
  ) {
    return this.serviceOrdersService.createServiceOrder(reqest.user._id, createServiceOrderDto, reqContext);
  }

  @Get('booked')
  @Permissions(Permission.ViewServiceOrder)
  @ApiOperation({
    summary: 'Lấy lịch sử các dịch vụ đã đặt của khách hàng',
    description: 'Endpoint cho phép khách hàng xem tất cả dịch vụ đã đặt có trạng thái "booked"',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách dịch vụ đã đặt thành công',
    type: [ServiceOrderItemHistoryResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy dịch vụ nào ở trạng thái đã đặt',
  })
  async customerGetBooked(
    @Request() request: { user: { _id: number } },
  ): Promise<ServiceOrderItemHistoryResponseDto[]> {
    return await this.serviceOrdersService.getBookedOrdersByCustomer(request.user._id);
  }
}
