import { Controller, Request, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ServiceWarrantyResponseDto } from './dto/create-service-order-detail.dto';
import { ServiceOrderDetailsService } from './service-order-details.service';

import { Permissions } from '@/auth/decorators/permissions.decorator';
import { Permission } from '@/auth/decorators/permissions.enum';

@ApiTags('Service-Order-Details-Customer')
@ApiBearerAuth()
@Controller('service-order-details')
export class CustomerServiceOrderDetailsController {
  constructor(private readonly serviceOrderDetailsService: ServiceOrderDetailsService) {}

  @Get('service-warranties')
  @Permissions(Permission.ViewServiceWarranty)
  @ApiOperation({ summary: 'Thông tin bảo hành của các dịch vụ đã sử dụng' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin bảo hành thành công',
    type: [ServiceWarrantyResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thông tin bảo hành' })
  async customerGetServiceWarranties(
    @Request() request: { user: { _id: number } },
  ): Promise<ServiceWarrantyResponseDto[]> {
    return await this.serviceOrderDetailsService.findAllServiceWarranty(request.user._id);
  }
}
