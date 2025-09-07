import { Controller, Body, Patch, Param, NotFoundException, Request, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AppointmentsService } from './appointments.service';
import { StatusUpdateResponseDto } from './dto/status-update-response.dto';
import {
  TechnicianCompleteRepairDto,
  TechnicianCompleteRepairResponseDto,
  TechnicianUpdateStatusDto,
} from './dto/update-status.dto';

import { Permissions } from '@/auth/decorators/permissions.decorator';
import { Permission } from '@/auth/decorators/permissions.enum';
import { BaseResponseDto } from '@/common/dtos/base-response.dto';
import { AddSpartPartsDto } from '@/service-order-details/dto/update-service-order-detail-request.dto';
import { AddSparePartsResponseDto } from '@/service-order-details/dto/update-service-order-detail-response.dto';
import { UsersService } from '@/users/users.service';

@ApiBearerAuth()
@ApiTags('Appointments-Technician')
@Controller('appointments')
export class TechnicianAppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private usersService: UsersService,
  ) {}

  @Patch(':id/status')
  @Permissions(Permission.UpdateAppointment)
  @ApiOperation({
    summary:
      'Cập nhật trạng thái lịch hẹn. Các trạng thái có thể chuyển sang: confirmed -> en_route, en_route -> arrived, quote_confirmed -> in_progress',
  })
  @ApiParam({ name: 'id', description: 'Appointment ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Trạng thái lịch hẹn đã được cập nhật',
    type: StatusUpdateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Không có quyền thực hiện',
  })
  async updateAppointmentStatus(
    // cần xem lại gửi thông báo!!!
    @Param('id') id: string,
    @Body() updateAppointmentStatusDto: TechnicianUpdateStatusDto,
    @Request() request: { user: { _id: number } },
  ): Promise<StatusUpdateResponseDto> {
    const userId = +request.user._id;

    if (!userId) {
      throw new NotFoundException('User not found');
    }

    // Dựa vào id appointment để lấy toàn bộ device token của người dùng(token ở đầy là của techinician!!)
    const deviceTokens = await this.usersService.getDeviceTokens(userId);

    if (!deviceTokens) {
      throw new NotFoundException(`Device tokens for user ID ${userId} not found`);
    }

    const result: StatusUpdateResponseDto | null = await this.appointmentsService.updateAppointmentStatus(
      +id,
      updateAppointmentStatusDto,
      userId,
      deviceTokens,
    );

    if (!result) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return result;
  }

  @Patch(':id/complete-repair')
  @Permissions(Permission.UpdateAppointment)
  @ApiOperation({
    summary: 'Cập nhật trạng thái lịch hẹn. Techinician hoành thành sửa chữa',
  })
  @ApiParam({ name: 'id', description: 'Appointment ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Technician hoàn thành sửa chữa. Lịch hẹn đã được cập nhật trạng thái',
    type: BaseResponseDto<TechnicianCompleteRepairResponseDto>,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Không có quyền thực hiện',
  })
  async completeRepair(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: { user: { technicianId: number } },
    @Body() dto: TechnicianCompleteRepairDto,
  ): Promise<BaseResponseDto<TechnicianCompleteRepairResponseDto>> {
    const appointment = await this.appointmentsService.findById(id);

    if (!appointment) throw new NotFoundException(`#${id} appointment not found!`);

    const customerId = appointment?.userId;

    // Dựa vào id appointment để lấy toàn bộ device token của người dùng(khách hàng)
    const deviceTokens = await this.usersService.getDeviceTokens(customerId ?? -1);

    if (!deviceTokens) {
      throw new NotFoundException(`Device tokens for user ID(Customer) ${customerId} not found`);
    }

    const data = await this.appointmentsService.completeRepair(id, request.user.technicianId, deviceTokens, dto);

    return {
      success: true,
      message: 'Kỹ thuật viên hoàn thành sửa chữa/bảo trì',
      data: data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/add-spare-parts')
  @Permissions(Permission.UpdateAppointment, Permission.UpdateServiceOrderDetail)
  @ApiOperation({ summary: 'Thêm linh kiện vào lịch hẹn' })
  @ApiParam({ name: 'id', description: 'Appointment ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Thêm linh kiện thành công',
    type: BaseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async addSpartParts(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: { user: { technicianId: number } },
    @Body() dto: AddSpartPartsDto,
  ): Promise<BaseResponseDto<AddSparePartsResponseDto>> {
    const technicianId = request.user.technicianId;
    const result = await this.appointmentsService.addSpareParts(id, technicianId, dto);

    return {
      success: true,
      message: 'Thêm linh kiện thành công',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}
