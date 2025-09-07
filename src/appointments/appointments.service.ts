import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  Appointment,
  AppointmentCancelBy,
  AppointmentStatusEnum,
  ChangedBy,
  PaymentMethodEnum,
  Prisma,
  RepairImageTypeEnum,
  ServiceOrderDetailStatusEnum,
  ServiceOrderStatusEnum,
  WarrantyStatus,
  WarrantyUnit,
} from '@prisma/client';
import { app } from 'firebase-admin';

import { AppointmentStatusHistoryDto } from './dto/appointment-status-history.dto';
import { AppointmentStatusDto } from './dto/appointment-status.dto';
import { CreateAppointmentRequestDto } from './dto/create-appointment-request.dto';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import {
  CustomerCancelAppointmentRequestDTO,
  CustomerCancelAppointmentResponseDTO,
  CustomerConfirmAppointmentResponseDTO,
} from './dto/customer-cancel-appointment.dto';
import { StatusUpdateResponseDto } from './dto/status-update-response.dto';
import { SupportRequestListItemDto } from './dto/support-request-list.dto';
import { SupportRequestResponseDto } from './dto/support-request-response.dto';
import {
  CustomerConfirmQuotiongRequestDto,
  CustomerUpdateAppointmentRequestDto,
  CustomerUpdateAppointmentResponseDto,
  UpdateAppointmentDto,
} from './dto/update-appointment.dto';
import {
  TechnicianCompleteRepairDto,
  TechnicianCompleteRepairResponseDto,
  TechnicianUpdateStatusDto,
} from './dto/update-status.dto';
import { validateStatusTransition } from './exceptions/invalid-appointment-status-transition.exception';

import { DatabaseService } from '@/database/database.service';
import { FcmService } from '@/notifications/fcm/fcm.service';
import { SocketService } from '@/notifications/socket/socket.service';
import { AddSpartPartsDto } from '@/service-order-details/dto/update-service-order-detail-request.dto';
import { AddSparePartsResponseDto } from '@/service-order-details/dto/update-service-order-detail-response.dto';
import { ServiceOrdersService } from '@/service-orders/service-orders.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: DatabaseService,
    private serviceOrderService: ServiceOrdersService,
    private readonly socketService: SocketService,
    private readonly fcmService: FcmService,
  ) {}

  /**
   * Lấy trạng thái của một lịch hẹn dựa trên ID và ID của người dùng.
   *
   * @param id - ID của lịch hẹn cần truy vấn.
   * @param userId - ID của người dùng đang yêu cầu thông tin lịch hẹn.
   * @returns Trả về một đối tượng `AppointmentStatusDto` chứa thông tin trạng thái lịch hẹn
   * hoặc `null` nếu không tìm thấy lịch hẹn.
   * @throws `ForbiddenException` nếu lịch hẹn không thuộc về người dùng có `userId` đã cung cấp.
   */
  async getAppointmentStatus(id: number, userId: number): Promise<AppointmentStatusDto | null> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      select: {
        currentStatus: true,
        scheduledDate: true,
        scheduledTime: true,
        employeeNote: true,
        customerNote: true,
        cancelReason: true,
        userId: true,
      },
    });

    if (!appointment) {
      return null;
    }

    // Kiểm tra nếu appointment không thuộc về user
    if (appointment.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập lịch hẹn này');
    }

    return {
      currentStatus: appointment.currentStatus,
      scheduledDate: appointment.scheduledDate,
      scheduledTime: appointment.scheduledTime,
      employeeNote: appointment.employeeNote || undefined,
      customerNote: appointment.customerNote || undefined,
      cancelReason: appointment.cancelReason || undefined,
    };
  }

  /**
   * Lấy lịch sử trạng thái của một lịch hẹn dựa trên ID lịch hẹn và ID người dùng.
   *
   * @param id - ID của lịch hẹn cần lấy lịch sử.
   * @param userId - ID của người dùng yêu cầu lấy lịch sử.
   * @returns Một mảng các đối tượng `AppointmentStatusHistoryDto` chứa thông tin lịch sử trạng thái
   *          hoặc `null` nếu không tìm thấy lịch hẹn.
   * @throws `ForbiddenException` nếu lịch hẹn không thuộc về người dùng yêu cầu.
   */
  async getAppointmentHistory(id: number, userId: number): Promise<AppointmentStatusHistoryDto[] | null> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      select: {
        statusHistories: {
          select: {
            old_status: true,
            new_status: true,
            changed_by: true,
            created_at: true,
          },
        },
        userId: true,
      },
    });

    if (!appointment) {
      return null;
    }

    // Kiểm tra nếu appointment không thuộc về user
    if (appointment.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập lịch hẹn này');
    }

    return appointment.statusHistories.map((history) => ({
      ...history,
      old_status: history.old_status as AppointmentStatusEnum | null,
      new_status: history.new_status as AppointmentStatusEnum | null,
    }));
  }

  /**
   * Cập nhật trạng thái của một lịch hẹn.
   *
   * @param id - ID của lịch hẹn cần cập nhật.
   * @param updateStatusDto - Dữ liệu cập nhật trạng thái, bao gồm trạng thái mới, chẩn đoán và ghi chú.
   * @param userId - ID của người dùng thực hiện cập nhật (kỹ thuật viên).
   * @param userDeviceTokens - Danh sách token thiết bị của người dùng để gửi thông báo (nếu có).
   * @returns Trả về thông tin cập nhật của lịch hẹn hoặc null nếu không thành công.
   *
   * @throws {NotFoundException} Nếu không tìm thấy lịch hẹn với ID đã cung cấp.
   * @throws {ForbiddenException} Nếu người dùng không phải là kỹ thuật viên hoặc không có quyền cập nhật lịch hẹn.
   * @throws {Error} Nếu trạng thái hiện tại không hợp lệ để chuyển đổi sang trạng thái mới.
   *
   * Chức năng chính:
   * 1. Lấy thông tin lịch hẹn hiện tại và kiểm tra quyền hạn của kỹ thuật viên.
   * 2. Kiểm tra tính hợp lệ của việc chuyển đổi trạng thái.
   * 3. Cập nhật trạng thái chính của lịch hẹn.
   * 4. Cập nhật hoặc tạo mới bản ghi trạng thái lịch hẹn trong bảng `AppointmentStatus`.
   * 5. Gửi thông báo real-time qua socket và push notification qua FCM (nếu có).
   * 6. Ghi log thay đổi trạng thái vào bảng `StatusHistory`.
   */
  async updateAppointmentStatus(
    id: number,
    updateStatusDto: TechnicianUpdateStatusDto,
    userId: number,
    userDeviceTokens: string[] | null,
  ): Promise<StatusUpdateResponseDto | null> {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Lấy trạng thái hiện tại
      const appointment = await prisma.appointment.findUnique({
        where: { id },
        select: {
          id: true,
          technicianId: true,
          currentStatus: true,
        },
      });

      if (!appointment) {
        throw new NotFoundException(`#${id} Appointment not found!`);
      }

      // Kiểm tra nếu appointment không thuộc về technician
      const technician = await prisma.technicians.findUnique({
        where: { user_id: userId },
        select: {
          id: true,
        },
      });

      if (!technician) {
        throw new ForbiddenException('Bạn không phải là kỹ thuật viên');
      }

      if (appointment.technicianId !== technician.id) {
        throw new ForbiddenException('Bạn không có quyền cập nhật lịch hẹn này');
      }

      // Kiểm tra trạng thại hiện tại có hợp lệ để cập nhật không
      validateStatusTransition(appointment.currentStatus, updateStatusDto.newStatus);

      // 2. Cập nhật trạng thái chính
      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          currentStatus: updateStatusDto.newStatus,
          // Cập nhật employeeNote nếu có
          ...(updateStatusDto.note && {
            employeeNote: updateStatusDto.note,
          }),
        },
      });

      // 3. Cập nhật AppointmentStatus (nếu cần)
      await prisma.appointmentStatus.upsert({
        where: { appointment_id: id },
        update: {
          status: updateStatusDto.newStatus,
          notes: updateStatusDto.note,
          update_at: new Date(),
        },
        create: {
          appointment_id: id,
          status: updateStatusDto.newStatus,
          notes: updateStatusDto.note,
          update_at: new Date(),
        },
      });

      // 4.1 Gửi thông báo real-time qua socket
      const notifySocket = () => {
        this.socketService.notifyOrderStatusChanged(userId, updatedAppointment.id, updatedAppointment.currentStatus);
      };

      // 4.2 Gửi push notification qua FCM
      const notifyFcm = async () => {
        if (!userDeviceTokens || userDeviceTokens.length === 0) {
          // Nếu không có device token, không cần gửi thông báo FCM
          return;
        }
        if (userDeviceTokens && userDeviceTokens.length > 0) {
          for (const token of userDeviceTokens) {
            await this.fcmService.notifyAppointmentStatusChanged(
              token,
              updatedAppointment.id,
              updateStatusDto.newStatus,
            );
          }
        }
      };

      // Call the notification functions after the transaction
      setImmediate(() => {
        void notifySocket();
        void notifyFcm();
      });

      // 5. Ghi log vào StatusHistory
      await prisma.statusHistory.create({
        data: {
          appointment_id: id,
          old_status: appointment.currentStatus,
          new_status: updateStatusDto.newStatus,
          changed_by: ChangedBy.technician,
        },
      });

      return {
        id: updatedAppointment.id,
        currentStatus: updatedAppointment.currentStatus,
        updatedAt: new Date(),
      };
    });
  }

  /**
   * Tạo một yêu cầu hỗ trợ mới cho một cuộc hẹn cụ thể.
   *
   * @param createSupportRequestDto - Dữ liệu để tạo yêu cầu hỗ trợ, bao gồm thông tin về cuộc hẹn, loại vấn đề và mô tả.
   * @param userId - ID của người dùng gửi yêu cầu hỗ trợ.
   * @returns Một đối tượng chứa thông tin của yêu cầu hỗ trợ vừa được tạo.
   * @throws NotFoundException - Nếu cuộc hẹn không tồn tại.
   * @throws ForbiddenException - Nếu người dùng không có quyền gửi yêu cầu hỗ trợ cho cuộc hẹn này.
   */
  async createSupportRequest(
    createSupportRequestDto: CreateSupportRequestDto,
    userId: number,
  ): Promise<SupportRequestResponseDto> {
    // Kiểm tra appointment có tồn tại và thuộc về user không
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: createSupportRequestDto.appointment_id },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment không tồn tại');
    }

    if (appointment.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền gửi yêu cầu hỗ trợ cho appointment này');
    }

    // Tạo yêu cầu hỗ trợ
    const supportRequest = await this.prisma.supportRequests.create({
      data: {
        appointment_id: createSupportRequestDto.appointment_id,
        user_id: userId,
        issue_type: createSupportRequestDto.issue_type,
        description: createSupportRequestDto.description,
      },
    });

    return {
      id: supportRequest.id,
      appointment_id: supportRequest.appointment_id,
      issue_type: supportRequest.issue_type,
      description: supportRequest.description,
      status: supportRequest.status,
      created_at: supportRequest.created_at,
    };
  }

  /**
   * Lấy danh sách yêu cầu hỗ trợ của người dùng dựa trên ID người dùng.
   *
   * @param userId - ID của người dùng cần lấy danh sách yêu cầu hỗ trợ.
   * @returns Một Promise trả về danh sách các yêu cầu hỗ trợ dưới dạng mảng `SupportRequestListItemDto`.
   *
   * Mỗi yêu cầu hỗ trợ bao gồm thông tin:
   * - `id`: ID của yêu cầu hỗ trợ.
   * - `issue_type`: Loại vấn đề của yêu cầu.
   * - `description`: Mô tả chi tiết của yêu cầu.
   * - `status`: Trạng thái hiện tại của yêu cầu.
   * - `created_at`: Thời gian tạo yêu cầu.
   * - `appointment`: Thông tin cuộc hẹn liên quan (nếu có), bao gồm:
   *   - `id`: ID của cuộc hẹn.
   *   - `scheduledDate`: Ngày dự kiến của cuộc hẹn.
   *   - `scheduledTime`: Giờ dự kiến của cuộc hẹn.
   *   - `currentStatus`: Trạng thái hiện tại của cuộc hẹn.
   *
   * Các yêu cầu được sắp xếp theo thứ tự thời gian giảm dần (mới nhất trước).
   */
  async getSupportRequestsByUser(userId: number): Promise<SupportRequestListItemDto[]> {
    const requests = await this.prisma.supportRequests.findMany({
      where: { user_id: userId },
      include: {
        appointment: {
          select: {
            id: true,
            scheduledDate: true,
            scheduledTime: true,
            currentStatus: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc', // Sắp xếp mới nhất trước
      },
    });

    return requests.map((request) => ({
      id: request.id,
      issue_type: request.issue_type,
      description: request.description,
      status: request.status,
      created_at: request.created_at,
      appointment: {
        id: request.appointment.id,
        scheduledDate: request.appointment.scheduledDate,
        scheduledTime: request.appointment.scheduledTime,
        currentStatus: request.appointment.currentStatus,
      },
    }));
  }

  /**
   * Hoàn thành sửa chữa một lịch hẹn.
   *
   * @param id - ID của lịch hẹn cần hoàn thành.
   * @param techinicianId - ID của kỹ thuật viên thực hiện sửa chữa.
   * @param userDeviceTokens - Danh sách token thiết bị của người dùng để gửi thông báo (có thể null).
   * @param dto - Dữ liệu từ kỹ thuật viên bao gồm trạng thái mới, ghi chú và hình ảnh.
   *
   * @returns Một đối tượng chứa thông tin lịch hẹn đã cập nhật, bao gồm:
   * - `id`: ID của lịch hẹn.
   * - `currentStatus`: Trạng thái hiện tại sau khi cập nhật.
   * - `updatedAt`: Thời gian cập nhật.
   * - `imageCount`: Số lượng hình ảnh được thêm vào.
   * - `images`: Danh sách hình ảnh đã thêm, bao gồm ID và URL.
   *
   * @throws `NotFoundException` Nếu không tìm thấy lịch hẹn với ID đã cung cấp.
   * @throws `ForbiddenException` Nếu kỹ thuật viên không có quyền cập nhật lịch hẹn này.
   * @throws `BadRequestException` Nếu trạng thái mới không hợp lệ hoặc không thể chuyển đổi từ trạng thái hiện tại.
   *
   * Chức năng này thực hiện các bước sau:
   * 1. Kiểm tra và lấy thông tin lịch hẹn hiện tại.
   * 2. Kiểm tra quyền của kỹ thuật viên đối với lịch hẹn.
   * 3. Cập nhật trạng thái chính của lịch hẹn.
   * 4. Cập nhật hoặc tạo mới trạng thái trong bảng `AppointmentStatus`.
   * 5. Gửi thông báo real-time qua socket cho kỹ thuật viên.
   * 6. Gửi thông báo push qua FCM cho khách hàng (nếu có token thiết bị).
   * 7. Ghi log thay đổi trạng thái vào bảng `StatusHistory`.
   * 8. Xử lý và lưu trữ hình ảnh sửa chữa (nếu có).
   */
  async completeRepair(
    id: number,
    techinicianId: number,
    userDeviceTokens: string[] | null,
    dto: TechnicianCompleteRepairDto,
  ): Promise<TechnicianCompleteRepairResponseDto> {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Lấy trạng thái hiện tại
      const appointment = await prisma.appointment.findUnique({
        where: { id },
        select: {
          id: true,
          serviceOrderDetail: {
            select: {
              id: true,
              service: {
                select: {
                  warranty_period: true,
                  warranty_unit: true,
                },
              },
            },
          },
          serviceOrder: {
            select: {
              id: true,
            },
          },
          technicianId: true,
          currentStatus: true,
        },
      });

      if (!appointment) {
        throw new NotFoundException(`#${id} Appointment not found!`);
      }

      // Kiểm tra nếu appointment không thuộc về technician
      const technician = await prisma.technicians.findUnique({
        where: { id: techinicianId },
        select: {
          id: true,
        },
      });

      if (!technician) {
        throw new ForbiddenException('Bạn không phải là kỹ thuật viên');
      }

      if (appointment.technicianId !== technician.id) {
        throw new ForbiddenException('Bạn không có quyền cập nhật lịch hẹn này');
      }

      // Kiểm tra trạng thái hiện tại có hợp lệ hay không
      if (dto.newStatus !== AppointmentStatusEnum.technician_done) {
        throw new BadRequestException('Trạng thái cập nhật mới phải là kỹ thuật viên hoàn thành!');
      }

      // Kiểm tra trạng thái hiện tại có thể chuyển sang technician_done không
      if (appointment.currentStatus !== AppointmentStatusEnum.in_progress) {
        throw new BadRequestException('Chỉ có thể hoàn thành từ trạng thái đang thực hiện');
      }

      // 2. Cập nhật trạng thái chính
      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          currentStatus: dto.newStatus,
          // Cập nhật employeeNote nếu có
          ...(dto.note && {
            employeeNote: dto.note,
          }),
        },
      });

      // 3. Cập nhật AppointmentStatus (nếu cần)
      await prisma.appointmentStatus.upsert({
        where: { appointment_id: id },
        update: {
          status: dto.newStatus,
          notes: dto.note,
          update_at: new Date(),
        },
        create: {
          appointment_id: id,
          status: dto.newStatus,
          notes: dto.note,
          update_at: new Date(),
        },
      });

      // 4.1 Gửi thông báo real-time qua socket(gửi cho technician)
      const notifySocket = () => {
        this.socketService.notifyOrderStatusChanged(
          techinicianId,
          updatedAppointment.id,
          updatedAppointment.currentStatus,
        );
      };

      // 4.2 Gửi push notification qua FCM(gửi cho khách hàng)
      const notifyFcm = async () => {
        if (!userDeviceTokens || userDeviceTokens.length === 0) {
          // Nếu không có device token, không cần gửi thông báo FCM
          return;
        }
        if (userDeviceTokens && userDeviceTokens.length > 0) {
          await Promise.all(
            userDeviceTokens.map((token) =>
              this.fcmService.notifyAppointmentStatusChanged(token, updatedAppointment.id, dto.newStatus),
            ),
          );
        }
      };

      // Call the notification functions after the transaction
      setImmediate(() => {
        void notifySocket();
        void notifyFcm();
      });

      // 5. Ghi log vào StatusHistory
      await prisma.statusHistory.create({
        data: {
          appointment_id: id,
          old_status: appointment.currentStatus,
          new_status: dto.newStatus,
          changed_by: ChangedBy.technician,
        },
      });

      const handleRepairImages = async () => {
        if (!dto.images?.length) return { imageCount: 0, images: [] };

        const images = await Promise.all(
          dto.images.map((image) =>
            prisma.repairImage.create({
              data: {
                image,
                image_type: RepairImageTypeEnum.post,
                appointmentId: id,
              },
            }),
          ),
        );

        // Tạo bảo hành dịch vụ
        await prisma.serviceWarranty.create({
          data: {
            orderDetailId: appointment.serviceOrderDetail.id,
            serviceId: appointment.serviceOrder.id,
            start_date: new Date(),
            end_date: this.calculateEndDate(
              new Date(),
              appointment.serviceOrderDetail.service.warranty_period,
              appointment.serviceOrderDetail.service.warranty_unit,
            ),
            status: WarrantyStatus.Active,
          },
        });

        return {
          imageCount: images.length,
          images: images.map((img) => ({ id: img.id, url: img.image })),
        };
      };

      const repairImagesResult = await handleRepairImages();

      return {
        id: updatedAppointment.id,
        currentStatus: updatedAppointment.currentStatus,
        updatedAt: new Date(),
        imageCount: repairImagesResult.imageCount,
        images: repairImagesResult.images,
      };
    });
  }

  calculateEndDate(startDate: Date, period: number, unit: WarrantyUnit) {
    // Logic tính ngày kết thúc bảo hành
    const result = new Date(startDate);

    switch (unit) {
      case WarrantyUnit.days:
        result.setDate(result.getDate() + period);
        break;
      case WarrantyUnit.months:
        result.setMonth(result.getMonth() + period);
        break;
      case WarrantyUnit.years:
        result.setFullYear(result.getFullYear() + period);
        break;
    }

    return result;
  }

  async addSpareParts(id: number, technicianId: number, dto: AddSpartPartsDto): Promise<AddSparePartsResponseDto> {
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Validate Appointment exists
      const appointment = await prisma.appointment.findUnique({
        where: { id },
      });

      if (!appointment) {
        throw new NotFoundException(`#${id} Appointment not found`);
      }

      // 2. Validate technician assignment
      if (appointment.technicianId !== technicianId) {
        throw new BadRequestException('Kỹ thuật viên không phụ trách Appointment');
      }

      // create data in UsedSpartPart table (also validate valid spareparts)

      // Lấy danh sách các ID linh kiện từ request
      const sparePartIds = dto.spareParts.map((item) => item.sparePartId);

      // Lấy danh sách linh kiện từ DB
      const existingSpareParts = await this.prisma.sparePart.findMany({
        where: { id: { in: sparePartIds } },
      });

      // Xác định các linh kiện không tồn tại
      const existingIds = existingSpareParts.map((part) => part.id);
      const invalidIds = sparePartIds.filter((id) => !existingIds.includes(id));

      if (invalidIds.length > 0) {
        throw new NotFoundException(`Các linh kiện không tồn tại: ${invalidIds.join(', ')}`);
      }

      // Kiểm tra tồn kho
      const insufficientParts: { id: number; name: string; requested: number; available: number }[] = [];

      for (const item of dto.spareParts) {
        const matched = existingSpareParts.find((p) => p.id === item.sparePartId);

        if (matched && matched.quantityInStock < item.quantity) {
          insufficientParts.push({
            id: matched.id,
            name: matched.name,
            requested: item.quantity,
            available: matched.quantityInStock,
          });
        }
      }

      if (insufficientParts.length > 0) {
        const msg = insufficientParts
          .map((p) => `Linh kiện "${p.name}" (ID: ${p.id}) chỉ còn ${p.available}, yêu cầu ${p.requested}`)
          .join('; ');

        throw new BadRequestException(`Không đủ số lượng tồn kho: ${msg}`);
      }

      // 5. Insert UsedSpareParts & update SparePart stock
      for (const item of dto.spareParts) {
        await prisma.usedSparePart.create({
          data: {
            appointmentId: appointment.id,
            sparePartId: item.sparePartId,
            quantityUsed: item.quantity,
          },
        });

        await prisma.sparePart.update({
          where: { id: item.sparePartId },
          data: {
            quantityInStock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 6. Tính tổng tiền linh kiện mới thêm
      let totalSparePartsPrice = 0;

      for (const item of dto.spareParts) {
        const matched = existingSpareParts.find((p) => p.id === item.sparePartId);

        if (matched) {
          totalSparePartsPrice += matched.price * item.quantity;
        }
      }

      // 7. Cập nhật lại tổng giá của serviceOrderDetail
      await prisma.serviceOrderDetail.update({
        where: { id: appointment.serviceOrderDetailId },
        data: {
          totalSparePartPrice: {
            increment: totalSparePartsPrice,
          },
          finalPrice: {
            increment: totalSparePartsPrice,
          },
        },
      });

      // 8. Cập nhật lại tổng giá của ServiceOrder
      await prisma.serviceOrder.update({
        where: { id: appointment.serviceOrderId },
        data: {
          totalAmount: {
            increment: totalSparePartsPrice,
          },
        },
      });

      // 9. Trả về dữ liệu
      return {
        appointmentId: appointment.id,
        serviceOrderDetailId: appointment.serviceOrderDetailId,
        sparePartCount: dto.spareParts.length,
        totalSparePartPrice: totalSparePartsPrice,
        addedSpareParts: dto.spareParts,
        addedSparePartsPrice: totalSparePartsPrice,
      };
    });
  }

  create(createAppointmentDto: CreateAppointmentRequestDto) {
    return 'This action adds a new appointment';
  }

  findAll() {
    return `This action returns all appointments`;
  }

  async findById(id: number): Promise<Partial<Appointment> | null> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) return null;

    return appointment;
  }

  update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    return `This action updates a #${id} appointment`;
  }

  async updatePartial(id: number, data: Prisma.AppointmentUpdateInput): Promise<Partial<Appointment>> {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    ) as Prisma.AppointmentUpdateInput;

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: filteredData,
    });

    return appointment;
  }

  /**
   * Xác nhận báo giá của khách hàng cho một cuộc hẹn.
   *
   * @param id - ID của cuộc hẹn cần xác nhận.
   * @param userId - ID của người dùng thực hiện xác nhận.
   * @returns Một Promise chứa thông tin phản hồi sau khi xác nhận thành công, bao gồm:
   * - `currentStatus`: Trạng thái hiện tại của cuộc hẹn sau khi xác nhận.
   * - `rescheduleCount`: Số lần dời lịch của cuộc hẹn.
   * - `appointmentId`: ID của cuộc hẹn đã được xác nhận.
   * - `updatedAt`: Thời gian cập nhật cuối cùng.
   *
   * @throws `NotFoundException` - Nếu không tìm thấy cuộc hẹn với ID đã cung cấp.
   * @throws `BadRequestException` - Nếu cuộc hẹn không thuộc về người dùng hoặc trạng thái hiện tại không hợp lệ.
   * @throws `InternalServerErrorException` - Nếu trạng thái của `ServiceOrderDetail` chứa cuộc hẹn không hợp lệ.
   */
  async customerQuoteConfirm(id: number, userId: number): Promise<CustomerConfirmAppointmentResponseDTO> {
    // check appoitment exist
    const appointment = await this.findById(id);

    if (!appointment) {
      throw new NotFoundException(`#${id} appointment not found`);
    }
    // check appointment belong to user
    if (appointment.userId != userId) {
      throw new BadRequestException('Do not have permission to cancel');
    }
    // check valid status
    if (appointment.currentStatus !== AppointmentStatusEnum.quoted) {
      throw new BadRequestException('Invalid current status. The Appointment need to quoted!');
    }

    // update appointment
    const updatedAppointment = await this.updatePartial(appointment.id ?? -1, {
      currentStatus: AppointmentStatusEnum.quote_confirmed,
    });

    // check valid status
    const serviceOrderDetail = await this.prisma.serviceOrderDetail.findUnique({
      where: { id: appointment.serviceOrderDetailId },
      select: { status: true },
    });

    if (serviceOrderDetail?.status !== ServiceOrderDetailStatusEnum.booked) {
      throw new InternalServerErrorException(
        `#${appointment.serviceOrderDetailId} ServiceOrderDetail that contain appointment doesn't have valid status`,
      );
    }

    // update serviceOrderDetail contain appointment
    await this.prisma.serviceOrderDetail.update({
      where: { id: appointment.serviceOrderDetailId },
      data: { status: ServiceOrderDetailStatusEnum.confirmed },
    });

    // return response
    return {
      currentStatus: updatedAppointment.currentStatus,
      rescheduleCount: updatedAppointment.rescheduleCount,
      appointmentId: appointment.id ?? -1,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Cập nhật thông tin cuộc hẹn của khách hàng.
   *
   * @param id - ID của cuộc hẹn cần cập nhật.
   * @param userId - ID của người dùng thực hiện cập nhật.
   * @param dto - Dữ liệu cập nhật từ khách hàng, bao gồm số điện thoại, địa chỉ, ngày giờ hẹn, và ghi chú.
   * @returns Thông tin cuộc hẹn đã được cập nhật, bao gồm ID, ngày giờ hẹn, địa chỉ, và ghi chú.
   *
   * @throws {NotFoundException} Nếu không tìm thấy cuộc hẹn với ID đã cung cấp.
   * @throws {BadRequestException} Nếu người dùng không có quyền cập nhật cuộc hẹn hoặc trạng thái cuộc hẹn không hợp lệ.
   * @throws {BadRequestException} Nếu trạng thái của ServiceOrderDetail không hợp lệ.
   */
  async customerUpdate(
    id: number,
    userId: number,
    dto: CustomerUpdateAppointmentRequestDto,
  ): Promise<CustomerUpdateAppointmentResponseDto> {
    return this.prisma.$transaction(async (prisma) => {
      // check appointment exist and belongs to user
      const appointment = await this.findById(id);

      if (!appointment) {
        throw new NotFoundException(`Appointment #${id} not found`);
      }
      if (appointment.userId !== userId) {
        throw new BadRequestException("Don't have permission to update this Appointment");
      }

      // validate statuses
      this.validateStatus(appointment.currentStatus, [AppointmentStatusEnum.booked, AppointmentStatusEnum.confirmed]);

      // validate reschedule count
      if ((appointment.rescheduleCount ?? 0) >= 3) {
        throw new BadRequestException('Exceeded reschedule time!');
      }
      // update appointment
      const updatedAppointment = await this.updatePartial(appointment.id ?? -1, {
        phone: dto.customerPhone,
        address: dto.customerAddress,
        scheduledDate: dto.scheduledDate,
        scheduledTime: dto.scheduledTime,
        customerNote: dto.customerNote,
        currentStatus: AppointmentStatusEnum.booked,
        rescheduleCount: (appointment.rescheduleCount ?? 0) + 1,
      });

      // update ServiceOrderDetail
      const serviceOrderDetail = await prisma.serviceOrderDetail.findUniqueOrThrow({
        where: { id: appointment.serviceOrderDetailId },
      });

      this.validateStatus(serviceOrderDetail.status, [
        ServiceOrderDetailStatusEnum.booked,
        ServiceOrderDetailStatusEnum.confirmed,
      ]);

      await prisma.serviceOrderDetail.update({
        where: { id: serviceOrderDetail.id },
        data: { status: ServiceOrderDetailStatusEnum.booked },
      });

      // update ServiceOrder
      const serviceOrder = await prisma.serviceOrder.findUniqueOrThrow({
        where: { id: updatedAppointment.serviceOrderId },
      });

      this.validateStatus(serviceOrder.status, [ServiceOrderStatusEnum.booked, ServiceOrderStatusEnum.confirmed]);

      await prisma.serviceOrder.update({
        where: { id: serviceOrder.id },
        data: { status: ServiceOrderStatusEnum.booked },
      });

      return {
        id: updatedAppointment.id ?? -1,
        scheduledDate: updatedAppointment.scheduledDate ?? new Date(),
        scheduledTime: updatedAppointment.scheduledTime ?? '',
        customerAddress: updatedAppointment.address ?? '',
        customerNote: updatedAppointment.customerNote ?? '',
      };
    });
  }

  private validateStatus(currentStatus: any, validStatuses: any[]) {
    if (!validStatuses.includes(currentStatus)) {
      throw new BadRequestException(`Invalid status, status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  /**
   * Hủy cuộc hẹn bởi khách hàng.
   *
   * @param id - ID của cuộc hẹn cần hủy.
   * @param userId - ID của người dùng thực hiện yêu cầu hủy.
   * @param dto - Dữ liệu yêu cầu hủy cuộc hẹn từ khách hàng.
   *
   * @returns Thông tin phản hồi sau khi hủy cuộc hẹn, bao gồm trạng thái hiện tại, lý do hủy, số lần đặt lại, ID cuộc hẹn,
   *          người thực hiện hủy và thời gian cập nhật.
   *
   * @throws NotFoundException - Nếu không tìm thấy cuộc hẹn với ID đã cung cấp.
   * @throws BadRequestException - Nếu cuộc hẹn không thuộc về người dùng thực hiện yêu cầu.
   * @throws InternalServerErrorException - Nếu không tìm thấy ServiceOrderDetail liên quan đến cuộc hẹn.
   */
  async customerCancel(
    id: number,
    userId: number,
    dto: CustomerCancelAppointmentRequestDTO,
  ): Promise<CustomerCancelAppointmentResponseDTO> {
    // validate appointment exist
    const appointment = await this.findById(id);

    if (!appointment) {
      throw new NotFoundException(`#${id} appointment not found`);
    }

    // validate appointment belong to user
    if (appointment.userId != userId) {
      throw new BadRequestException('Do not have permission to cancel');
    }

    // update appointment
    // Update appointment's status
    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        currentStatus: AppointmentStatusEnum.cancelled,

        cancelReason: dto.cancelReason,
        cancelBy: AppointmentCancelBy.customer,
      },
    });

    // Update detail
    await this.prisma.serviceOrderDetail.update({
      where: { id: appointment.serviceOrderDetailId },
      data: {
        status: ServiceOrderStatusEnum.cancelled,
      },
    });

    // update serviceOrder (if serviceOrder does not have any incacel detail give it a cancel status)
    // find all details of the serviceOrder
    // Get all details and validate their statuses
    const details = await this.serviceOrderService.findAllServiceOrderDetails(appointment.serviceOrderId ?? -1);

    if (details.length === 0) {
      throw new InternalServerErrorException('ServiceOrderDetail that contain this appointment has no ServiceOrder!');
    }

    // check allDetails are cancelled or not
    const isAllCancelled = details.every((detail) => detail.status === ServiceOrderDetailStatusEnum.cancelled);

    // if all details have cancel status => go to update the status of serviceOrder to cancel
    if (isAllCancelled) {
      await this.prisma.serviceOrder.update({
        where: { id: appointment.serviceOrderId },
        data: {
          status: ServiceOrderStatusEnum.cancelled,
        },
      });
    }

    // return
    return {
      currentStatus: updatedAppointment.currentStatus,
      cancelReason: dto.cancelReason,
      rescheduleCount: updatedAppointment.rescheduleCount,
      appointmentId: appointment.id ?? -1,
      cancelBy: updatedAppointment.cancelBy ?? AppointmentCancelBy.customer,
      updatedAt: new Date().toISOString(),
    };
  }

  remove(id: number) {
    return `This action removes a #${id} appointment`;
  }
}
