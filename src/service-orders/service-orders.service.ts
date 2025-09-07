import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import {
  AppointmentStatusEnum,
  EntityType,
  NotificationType,
  NotificationStatus,
  Prisma,
  ServiceOrder,
  ServiceOrderDetailStatusEnum,
  ServiceOrderStatusEnum,
  Appointment,
} from '@prisma/client';

import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { ServiceOrderItemHistoryResponseDto, ServiceOrderResponseDto } from './dto/service-order-response.dto';
import {
  ServiceOrderPaymentStatusResponse,
  UpdateServiceOrderPaymentStatusRequest,
} from './dto/update-service-order.dto';

import { NotificationHelper } from '@/common/helpers/notification.helper';
import { RequestWithContext } from '@/common/interceptors/request.interface';
import { DatabaseService } from '@/database/database.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { ServiceImageDto } from '@/services/dto/services.dto';
import { UsersService } from '@/users/users.service';

@Injectable()
export class ServiceOrdersService {
  constructor(
    private prisma: DatabaseService,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  /**
   * Tạo một đơn hàng dịch vụ mới cho khách hàng.
   *
   * @param customerId - ID của khách hàng cần tạo đơn hàng.
   * @param dto - Dữ liệu chi tiết của đơn hàng, bao gồm thông tin dịch vụ, lịch hẹn, và nhân viên (nếu có).
   * @param req - Yêu cầu HTTP kèm theo ngữ cảnh (context) để lưu trữ các cảnh báo hoặc thông tin bổ sung.
   *
   * @returns Một đối tượng chứa thông tin về đơn hàng, bao gồm:
   * - `message`: Thông báo kết quả.
   * - `orderId`: ID của đơn hàng đã tạo.
   * - `appointmentId`: ID của lịch hẹn (nếu có).
   *
   * @throws Error nếu:
   * - Khách hàng không tồn tại.
   * - Dịch vụ không tồn tại hoặc đã ngừng hoạt động.
   * - Thông tin lịch hẹn không đầy đủ hoặc không hợp lệ.
   *
   * @remarks
   * - Phương thức này sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu khi tạo đơn hàng và các chi tiết liên quan.
   * - Sau khi tạo đơn hàng, nếu có lịch hẹn, hệ thống sẽ tạo thông báo và cố gắng gửi thông báo đến khách hàng.
   * - Nếu việc gửi thông báo thất bại, trạng thái thông báo sẽ được cập nhật thành "failed" và cảnh báo sẽ được ghi lại trong ngữ cảnh.
   */
  async createServiceOrder(customerId: number, dto: CreateServiceOrderDto, req: RequestWithContext) {
    const { serviceOrder, user, serviceDetailsList, appointmentInfo } = await this.prisma.$transaction(
      async (prisma) => {
        // 1. Validate customer exists
        const user = await this.usersService.getUserById({
          id: customerId,
        });

        if (!user) throw new Error('Khách hàng không tồn tại');

        // 2. Tạo đơn hàng chính
        const serviceOrder = await prisma.serviceOrder.create({
          data: {
            customerId: customerId,
            totalAmount: 0,
          },
        });

        let appointmentTime = 'Chưa có lịch hẹn';
        const serviceDetailsList: string[] = [];
        let createdAppointmentId: number | null = null;

        // 3. Xử lý chi tiết đơn hàng
        await Promise.all(
          dto.details.map(async (detail) => {
            // Kiểm tra dịch vụ tồn tại
            const service = await prisma.services.findUnique({
              where: { id: detail.serviceId },
              select: { id: true, name: true, is_active: true },
            });

            if (!service) throw new BadRequestException(`Dịch vụ ${detail.serviceId} không tồn tại`);
            if (!service.is_active) throw new BadRequestException(`Dịch vụ ${detail.serviceId} đã ngừng hoạt động`);

            serviceDetailsList.push(service.name);

            // 2. Xác định status của serviceOrderDetail
            const detailStatus = detail.appointment
              ? ServiceOrderDetailStatusEnum.booked
              : ServiceOrderDetailStatusEnum.confirmed;

            // Tạo chi tiết đơn hàng
            const orderDetail = await prisma.serviceOrderDetail.create({
              data: {
                orderId: serviceOrder.id,
                serviceId: detail.serviceId,
                status: detailStatus,
              },
            });

            // 4. Xử lý lịch hẹn (nếu có)
            if (detail.appointment) {
              const { scheduledDate, scheduledTime, customerAddress, customerNote } = detail.appointment;

              if (!scheduledDate || !scheduledTime || !customerAddress) {
                throw new Error('Thông tin lịch hẹn không đầy đủ');
              }

              const parsedDate = new Date(scheduledDate);

              if (isNaN(parsedDate.getTime())) {
                throw new Error('Ngày hẹn không hợp lệ');
              }

              const appointment = await prisma.appointment.create({
                data: {
                  userId: customerId,
                  serviceOrderId: serviceOrder.id,
                  serviceOrderDetailId: orderDetail.id,
                  fullName: dto.customerFullName || user.fullName,
                  phone: dto.customerPhone || user.phone || '',
                  email: user.email || null,
                  address: customerAddress,
                  scheduledDate: parsedDate,
                  scheduledTime: scheduledTime,
                  customerNote: customerNote || null,
                  currentStatus: AppointmentStatusEnum.booked,
                },
              });

              createdAppointmentId = appointment.id;
              appointmentTime = `${parsedDate.toLocaleDateString()} - ${scheduledTime}`;
            }
          }),
        );

        // 5. Lấy thông tin nhân viên
        const staff = dto.staffId ? await this.usersService.getUserById({ id: dto.staffId }) : null;
        const staffName = staff?.fullName || 'Chưa có nhân viên';

        return {
          serviceOrder,
          user,
          serviceDetailsList,
          appointmentInfo: {
            appointmentId: createdAppointmentId,
            appointmentTime,
            staffName,
          },
        };
      },
    );

    try {
      // 6. Tạo và gửi thông báo (nằm ngoài transaction)
      if (!appointmentInfo.appointmentId) {
        req.ctx.warnings.push('Không thể tạo thông báo do thiếu appointmentId');

        return {
          message: 'Đặt dịch vụ thành công (không gửi được thông báo)',
          orderId: serviceOrder.id,
          appointmentId: appointmentInfo.appointmentId,
        };
      }

      const notification = await this.prisma.notifications.create({
        data: {
          entity_id: appointmentInfo.appointmentId,
          entity_type: EntityType.appointment,
          type: NotificationType.email,
          title: 'Đặt dịch vụ thành công',
          content: NotificationHelper.createOrderSuccessMessage(
            serviceOrder.id,
            user.fullName,
            appointmentInfo.staffName,
            serviceDetailsList.join(', '),
            appointmentInfo.appointmentTime,
          ),
          status: NotificationStatus.pending, // Đánh dấu là đang chờ gửi
        },
      });

      // 7. Gửi thông báo (không ảnh hưởng đến kết quả chính)
      try {
        await this.notificationsService.sendNotificationToUsers({
          notificationId: notification.notification_id,
          userIds: [customerId],
        });

        // Cập nhật trạng thái nếu gửi thành công
        await this.prisma.notifications.update({
          where: { notification_id: notification.notification_id },
          data: { status: NotificationStatus.sent },
        });
      } catch (err) {
        if (err instanceof Error) {
          // Nếu có lỗi trong quá trình gửi thông báo, cập nhật trạng thái về "failed"
          req.ctx.warnings.push(`Gửi thông báo thất bại: ${err.message}`);
        }
      }

      return {
        message: 'Đặt dịch vụ thành công',
        orderId: serviceOrder.id,
        appointmentId: appointmentInfo.appointmentId,
      };
    } catch (error) {
      // Nếu lỗi ở phần thông báo, vẫn trả về kết quả chính
      console.error('Lỗi khi gửi thông báo:', error);
      if (error instanceof Error) {
        req.ctx.warnings.push(`Lỗi gửi thông báo: ${error.message}`);
      }

      return {
        message: 'Đặt dịch vụ thành công (gửi thông báo thất bại)',
        orderId: serviceOrder.id,
        appointmentId: appointmentInfo.appointmentId,
      };
    }
  }

  /**
   * Xác nhận đơn hàng dịch vụ bởi quản trị viên.
   *
   * @param id - ID của đơn hàng dịch vụ cần xác nhận.
   * @param userId - ID của người dùng thực hiện xác nhận.
   * @returns Một Promise trả về đối tượng `ServiceOrderResponseDto` chứa thông tin chi tiết của đơn hàng dịch vụ đã được xác nhận.
   * @throws `NotFoundException` nếu không tìm thấy đơn hàng dịch vụ với ID đã cung cấp.
   * @throws `InternalServerErrorException` nếu đơn hàng dịch vụ không có chi tiết nào.
   *
   * Chức năng này thực hiện các bước sau:
   * 1. Kiểm tra sự tồn tại của đơn hàng dịch vụ.
   * 2. Lấy tất cả các chi tiết của đơn hàng dịch vụ và kiểm tra trạng thái của chúng.
   * 3. Cập nhật trạng thái của đơn hàng dịch vụ thành "đã xác nhận".
   * 4. Trả về thông tin chi tiết của đơn hàng dịch vụ đã được xác nhận.
   */
  async adminConfirm(id: number, userId: number): Promise<ServiceOrderResponseDto> {
    // validate serviceOrder exist
    const serviceOrder = await this.findById(id);

    if (!serviceOrder) {
      throw new NotFoundException(`#${id} ServiceOrder not found!`);
    }

    // Get all details and validate their statuses
    const details = await this.findAllServiceOrderDetails(serviceOrder.id ?? -1);

    if (details.length === 0) {
      throw new InternalServerErrorException('ServiceOrder has no ServiceOrderDetail!');
    }

    // Filter details based on validation rules
    const validDetails = details.filter((detail) => {
      if (detail.status !== ServiceOrderDetailStatusEnum.cancelled) {
        return true;
      }

      return false;
    });

    if (validDetails.length === 0) {
      throw new InternalServerErrorException('The ServiceOrder have no valid ServiceOrderDetail!');
    }

    // Invalid details are those that don't meet either condition above
    const cancelledDetails = details.filter((detail) => {
      if (detail.status === ServiceOrderDetailStatusEnum.cancelled) {
        return true;
      }

      return false;
    });

    const appointment = validDetails.find((detail) => detail.appointment !== null)?.appointment;
    // update the appointment to the confirmed status
    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointment?.id ?? -1 },
      data: {
        currentStatus: AppointmentStatusEnum.confirmed,
      },
    });

    // update the serviceOrderDetail to the confirmed status also
    await this.prisma.serviceOrderDetail.update({
      where: { id: appointment?.serviceOrderDetailId ?? -1 },
      data: {
        status: ServiceOrderDetailStatusEnum.confirmed,
      },
    });

    // update serviceOrder status
    const updatedServiceOrder = await this.updatePartial(serviceOrder.id ?? -1, {
      status: ServiceOrderStatusEnum.confirmed,
      updatedAt: new Date(),
      updatedBy: userId,
    });

    // return response
    return {
      id: serviceOrder.id ?? -1,
      status: ServiceOrderStatusEnum.confirmed,
      orderDate: updatedServiceOrder.orderDate?.toISOString() ?? '',
      totalAmount: updatedServiceOrder.totalAmount ?? 0,
      customerId: updatedServiceOrder.customerId ?? -1,
      appointment: {
        id: updatedAppointment?.id ?? -1,
        serviceOrderDetailId: updatedAppointment?.serviceOrderDetailId ?? -1,
        scheduledDate: updatedAppointment?.scheduledDate ?? new Date(),
        scheduledTime: updatedAppointment?.scheduledTime ?? '',
        currentStatus: updatedAppointment?.currentStatus ?? '',
      },
      serviceDetails: validDetails,
      invalidServiceDetails: cancelledDetails,
    };

    // Have to check order status when manipulate the appointment, detail?
  }

  /**
   * Hoàn thành một đơn dịch vụ với vai trò quản trị viên.
   *
   * @param id - ID của đơn dịch vụ cần hoàn thành.
   * @param userId - ID của người dùng thực hiện hành động hoàn thành đơn dịch vụ.
   * @returns Một Promise trả về đối tượng `ServiceOrderResponseDto` chứa thông tin của đơn dịch vụ đã hoàn thành.
   *
   * @throws `NotFoundException` - Nếu không tìm thấy đơn dịch vụ với ID đã cung cấp.
   * @throws `BadRequestException` - Nếu trạng thái của đơn dịch vụ không hợp lệ để hoàn thành
   * hoặc nếu có chi tiết đơn dịch vụ không hợp lệ.
   * @throws `InternalServerErrorException` - Nếu đơn dịch vụ không có chi tiết nào
   * hoặc tổng giá cuối cùng của các chi tiết không khớp với tổng số tiền của đơn dịch vụ.
   *
   * ### Quy trình:
   * 1. Xác thực sự tồn tại của đơn dịch vụ.
   * 2. Kiểm tra trạng thái của đơn dịch vụ (phải là `confirmed`).
   * 3. Lấy tất cả các chi tiết của đơn dịch vụ và kiểm tra trạng thái của chúng:
   *    - Trạng thái `confirmed` và không có lịch hẹn.
   *    - Trạng thái `confirmed` và có lịch hẹn với trạng thái `technician_done`.
   * 4. Nếu có chi tiết không hợp lệ, ném lỗi `BadRequestException`.
   * 5. Tính tổng giá cuối cùng của các chi tiết hợp lệ và so sánh với tổng số tiền của đơn dịch vụ.
   * 6. Nếu hợp lệ, cập nhật trạng thái của đơn dịch vụ thành `completed`.
   * 7. Trả về thông tin của đơn dịch vụ đã hoàn thành.
   */
  async adminComplete(id: number, userId: number): Promise<ServiceOrderResponseDto> {
    // validate order exist
    const serviceOrder = await this.findById(id);

    if (!serviceOrder) {
      throw new NotFoundException('ServiceOrder not found!');
    }

    // check status booked ??
    if (serviceOrder.status !== ServiceOrderStatusEnum.paid) {
      throw new BadRequestException('ServiceOrder does not have valid status to complete');
    }

    // Get all details and validate their statuses
    const details = await this.findAllServiceOrderDetails(serviceOrder.id ?? -1);

    if (details.length === 0) {
      throw new InternalServerErrorException('ServiceOrder has no ServiceOrderDetail!');
    }

    // Filter details based on validation rules
    const validDetails = details.filter((detail) => {
      // Case 1: Status is confirmed AND has no appointment
      if (detail.status === ServiceOrderDetailStatusEnum.confirmed && !detail.appointment) {
        return true;
      }

      // Case 2: Status is confirmed AND has appointment with technician_done status
      if (
        detail.status === ServiceOrderDetailStatusEnum.confirmed &&
        detail.appointment?.currentStatus === AppointmentStatusEnum.technician_done
      ) {
        return true;
      }

      return false;
    });

    if (validDetails.length === 0) {
      throw new InternalServerErrorException('There are no valid ServiceOrderDetail to complete the ServiceOrder');
    }

    // Invalid details are those that don't meet either condition above
    const invalidDetails = details.filter((detail) => {
      return !(
        detail.status === ServiceOrderDetailStatusEnum.confirmed &&
        (!detail.appointment || detail.appointment.currentStatus === AppointmentStatusEnum.technician_done)
      );
    });

    // compute the total of all finalPrice of the detail
    // compare it to the totalAmount of the service Order
    const totalFinalPrice = validDetails.reduce((sum, detail) => {
      return sum + (detail.finalPrice || 0);
    }, 0);

    if (totalFinalPrice !== (serviceOrder.totalAmount ?? 0)) {
      throw new InternalServerErrorException('TotalFinnalPrice inconsistence to TotalAmount!');
    }

    // If it's valid go to update orderStatus
    // update orderStatus
    await this.updatePartial(serviceOrder.id ?? -1, {
      status: ServiceOrderStatusEnum.completed,
      updatedBy: userId,
      updatedAt: new Date(),
    });

    // Find the first appointment from valid details (if any)
    const appointment = validDetails.find((detail) => detail.appointment)?.appointment;

    // Update appoitment status also

    // return response
    return {
      id: serviceOrder.id ?? -1,
      status: ServiceOrderStatusEnum.completed,
      orderDate: serviceOrder.orderDate?.toISOString() ?? '',
      totalAmount: serviceOrder.totalAmount ?? 0,
      customerId: serviceOrder.customerId ?? -1,
      appointment: {
        id: appointment?.id ?? -1,
        serviceOrderDetailId: appointment?.serviceOrderDetailId ?? -1,
        scheduledDate: appointment?.scheduledDate ?? new Date(),
        scheduledTime: appointment?.scheduledTime ?? '',
        currentStatus: appointment?.currentStatus ?? '',
      },
      serviceDetails: invalidDetails,
      invalidServiceDetails: invalidDetails,
    };
  }

  async updatePartial(
    id: number,
    data: Prisma.ServiceOrderUpdateInput, // Sử dụng chính xác kiểu Prisma generate
  ): Promise<Partial<ServiceOrder>> {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    ) as Prisma.ServiceOrderUpdateInput;

    const serviceOrder = await this.prisma.serviceOrder.update({
      where: { id },
      data: filteredData,
    });

    return serviceOrder;
  }
  // findAll() {
  //   return `This action returns all serviceOrders`;
  // }
  async findById(id: number): Promise<Partial<ServiceOrder> | null> {
    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: { id },
    });

    if (!serviceOrder) {
      return null;
    }

    return serviceOrder;
  }

  // async findAllServiceOrderDetails(id: number): Promise<ServiceOrderDetail[]> {
  //   return await this.prisma.serviceOrderDetail.findMany({
  //     where: { orderId: id },
  //     include: { appointment: true },
  //   });
  // }
  async findAllServiceOrderDetails(id: number): Promise<
    Prisma.ServiceOrderDetailGetPayload<{
      include: { appointment: true };
    }>[]
  > {
    return this.prisma.serviceOrderDetail.findMany({
      where: { orderId: id },
      include: { appointment: true },
    });
  }

  async findAllAppointment(id: number): Promise<Partial<Appointment>[]> {
    return await this.prisma.appointment.findMany({
      where: { serviceOrderId: id },
    });
  }

  /**
   * Cập nhật trạng thái thanh toán của đơn dịch vụ bởi kỹ thuật viên.
   *
   * @param id - ID của đơn dịch vụ cần cập nhật.
   * @param technicianId - ID của kỹ thuật viên thực hiện cập nhật.
   * @param dto - Dữ liệu yêu cầu cập nhật trạng thái thanh toán, bao gồm phương thức thanh toán.
   * @returns Trả về thông tin trạng thái thanh toán của đơn dịch vụ sau khi cập nhật.
   *
   * @throws {NotFoundException} Nếu không tìm thấy đơn dịch vụ với ID đã cung cấp.
   * @throws {BadRequestException} Nếu kỹ thuật viên không được chỉ định cho đơn dịch vụ này.
   * @throws {BadRequestException} Nếu không có chi tiết đơn dịch vụ nào ở trạng thái "đã xác nhận".
   * @throws {BadRequestException} Nếu trạng thái của cuộc hẹn không phải là "kỹ thuật viên đã hoàn thành".
   */
  async technicianUpdatePaymentStatus(
    id: number,
    technicianId: number,
    dto: UpdateServiceOrderPaymentStatusRequest,
  ): Promise<ServiceOrderPaymentStatusResponse> {
    // 1. Check if the service order exists
    const serviceOrder = await this.findById(id);

    if (!serviceOrder) {
      throw new NotFoundException('ServiceOrder not found!');
    }

    // check status
    if (serviceOrder.status !== ServiceOrderStatusEnum.confirmed) {
      throw new BadRequestException('The Service order status much be confirmed before set payment status');
    }

    // 2. Check if the technician is assigned to this service order
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        serviceOrderId: id,
        technicianId: technicianId,
      },
    });

    if (!appointment) {
      throw new BadRequestException('Technician is not assigned to this ServiceOrder!');
    }

    // 3. Validate service order details (status must be confirmed)
    const details = await this.findAllServiceOrderDetails(id);
    const validDetails = details.filter((detail) => detail.status === ServiceOrderDetailStatusEnum.confirmed);

    if (validDetails.length === 0) {
      throw new BadRequestException('No valid ServiceOrderDetail found for this ServiceOrder!');
    }

    // 4. Check if the appointment's status is done
    if (appointment.currentStatus !== AppointmentStatusEnum.technician_done) {
      throw new BadRequestException('Appointment is not completed by the technician!');
    }

    // 5. Update the service order status to paid and set the payment method
    const updatedServiceOrder = await this.updatePartial(id, {
      status: ServiceOrderStatusEnum.paid,
      paymentMethod: dto.paymentMethod,
      updatedBy: technicianId,
      updatedAt: new Date(),
    });

    // 6. Return the mapped response
    return {
      id: updatedServiceOrder.id ?? -1,
      status: updatedServiceOrder.status ?? ServiceOrderStatusEnum.paid,
      paymentMethod: updatedServiceOrder.paymentMethod ?? dto.paymentMethod,
      updatedAt: updatedServiceOrder.updatedAt ?? new Date(),
      updatedBy: updatedServiceOrder.updatedBy ?? -1,
    };
  }

  /**
   * Lấy thông tin các đơn hàng dịch vụ customer đã đặt
   *
   * @param customerId - ID của khách hàng
   * @returns Danh sách các đơn hàng dịch vụ mà khách hàng đã đặt
   */
  async getBookedOrdersByCustomer(customerId: number): Promise<ServiceOrderItemHistoryResponseDto[]> {
    // 1. Lấy danh sách các đơn hàng dịch vụ của khách hàng
    const serviceOrders = await this.prisma.serviceOrder.findMany({
      where: { customerId },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        serviceOrderDetails: {
          select: {
            id: true,
            finalPrice: true,
            service: {
              select: {
                name: true,
                description: true,
                ServiceImages: true,
              },
            },
          },
        },
      },
    });

    // 2. Map dữ liệu để trả về danh sách lịch sử đơn hàng
    return serviceOrders.map((order) => ({
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount ?? -1,
      serviceOrderDetails: (
        order.serviceOrderDetails as Array<{
          id: number;
          finalPrice: number | null;
          service: {
            name: string;
            description: string;
            ServiceImages: ServiceImageDto[];
          };
        }>
      ).map((detail) => ({
        id: detail.id,
        finalPrice: detail.finalPrice,
        name: detail.service.name,
        description: detail.service.description,
        images: detail.service.ServiceImages,
      })),
    }));
  }

  // update(id: number, updateServiceOrderDto: UpdateServiceOrderDto) {
  //   return `This action updates a #${id} serviceOrder`;
  // }
  // remove(id: number) {
  //   return `This action removes a #${id} serviceOrder`;
  // }
}
