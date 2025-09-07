import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
  Request,
  Post,
  Body,
  BadRequestException,
  Query,
  ForbiddenException,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AppointmentsService } from './appointments.service';
import { AppointmentStatusHistoryDto } from './dto/appointment-status-history.dto';
import { AppointmentStatusDto } from './dto/appointment-status.dto';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import {
  CustomerCancelAppointmentRequestDTO,
  CustomerCancelAppointmentResponseDTO,
  CustomerConfirmAppointmentResponseDTO,
} from './dto/customer-cancel-appointment.dto';
import { SupportRequestListItemDto } from './dto/support-request-list.dto';
import { SupportRequestResponseDto } from './dto/support-request-response.dto';
import {
  CustomerConfirmQuotiongRequestDto,
  CustomerUpdateAppointmentRequestDto,
  CustomerUpdateAppointmentResponseDto,
} from './dto/update-appointment.dto';

import { Permissions } from '@/auth/decorators/permissions.decorator';
import { Permission } from '@/auth/decorators/permissions.enum';

@ApiBearerAuth()
@ApiTags('Appointments-Customer')
@Controller('appointments')
export class CustomerAppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get(':id/status')
  @Permissions(Permission.ViewAppointment)
  @ApiOperation({ summary: 'Lấy trạng thái hiện tại của lịch hẹn' })
  @ApiParam({ name: 'id', description: 'Appointment ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Trạng thái lịch hẹn',
    type: AppointmentStatusDto,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async getAppointmentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: { user: { _id: number } },
  ): Promise<AppointmentStatusDto> {
    const appointment = await this.appointmentsService.getAppointmentStatus(id, +request.user._id);

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  @Get(':id/history')
  @Permissions(Permission.ViewAppointment)
  @ApiOperation({ summary: 'Lấy lịch sử trạng thái của lịch hẹn' })
  @ApiParam({ name: 'id', description: 'Appointment ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lịch sử trạng thái của lịch hẹn',
    type: AppointmentStatusHistoryDto,
    isArray: true,
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async getAppointmentHistory(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: { user: { _id: number } },
  ): Promise<AppointmentStatusHistoryDto[]> {
    const history = await this.appointmentsService.getAppointmentHistory(id, request.user._id);

    if (!history) {
      throw new NotFoundException(`Appointment with ID ${id} does not exist or does not have history`);
    }

    return history;
  }

  @Post('support-request')
  @Permissions(Permission.CreateSupportRequests)
  @ApiOperation({ summary: 'Gửi yêu cầu hỗ trợ' })
  @ApiResponse({
    status: 201,
    description: 'Yêu cầu hỗ trợ đã được tạo',
    type: SupportRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền gửi yêu cầu' })
  async create(
    @Body() createSupportRequestDto: CreateSupportRequestDto,
    @Request() req: { user: { _id: number } },
  ): Promise<SupportRequestResponseDto> {
    try {
      const userId = req.user._id;

      return await this.appointmentsService.createSupportRequest(createSupportRequestDto, +userId);
    } catch (error: unknown) {
      throw new BadRequestException(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }

  @Get('support-request/:id')
  @Permissions(Permission.ViewSupportRequests)
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu hỗ trợ theo user_id' })
  @ApiQuery({ name: 'user_id', required: true, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Danh sách yêu cầu hỗ trợ',
    type: [SupportRequestListItemDto],
  })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async getSupportRequestsByUser(
    @Query('user_id', ParseIntPipe) userId: number,
    @Request() req: { user: { _id: number } },
  ): Promise<SupportRequestListItemDto[]> {
    // Kiểm tra nếu user request không phải là admin và không phải chính user đó
    if (req.user._id !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập danh sách này');
    }

    return this.appointmentsService.getSupportRequestsByUser(userId);
  }

  @Patch(':id/quote-confirm')
  @Permissions(Permission.UpdateAppointment, Permission.UpdateServiceOrderDetail)
  @ApiOperation({ summary: 'Khách hàng xác nhận báo giá sau khi kỹ thuật viên báo giá' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin lịch hẹn',
    type: CustomerConfirmAppointmentResponseDTO,
  })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async customerConfirm(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { _id: number } },
  ): Promise<CustomerConfirmAppointmentResponseDTO> {
    const userId = req.user._id;

    return this.appointmentsService.customerQuoteConfirm(id, userId);
  }

  @Patch(':id/cancel')
  @Permissions(Permission.UpdateAppointment, Permission.UpdateServiceOrderDetail)
  @ApiOperation({ summary: 'Khách hàng huỷ lịch hẹn' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin huỷ lịch hẹn',
    type: CustomerCancelAppointmentResponseDTO,
  })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async customerCancel(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { _id: number } },
    @Body() dto: CustomerCancelAppointmentRequestDTO,
  ): Promise<CustomerCancelAppointmentResponseDTO> {
    return this.appointmentsService.customerCancel(id, req.user._id, dto);
  }

  @Patch(':id/customer-update')
  @Permissions(Permission.UpdateAppointment, Permission.UpdateServiceOrderDetail, Permission.UpdateServiceOrder)
  @ApiOperation({ summary: 'Khách hàng cập nhật lịch hẹn' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin lịch hẹn',
    type: CustomerUpdateAppointmentResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async customerUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { _id: number } },
    @Body() dto: CustomerUpdateAppointmentRequestDto,
  ): Promise<CustomerUpdateAppointmentResponseDto> {
    const userId = req.user._id;

    return this.appointmentsService.customerUpdate(id, userId, dto);
  }
}
