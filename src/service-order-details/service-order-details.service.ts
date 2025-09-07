import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatusEnum, Prisma, RepairImageTypeEnum, ServiceOrderDetail } from '@prisma/client';

import { CreateServiceOrderDetailDto, ServiceWarrantyResponseDto } from './dto/create-service-order-detail.dto';
import {
  AddSpartPartsDto,
  UpdateServiceOrderDetailQuoteRequestDto,
} from './dto/update-service-order-detail-request.dto';
import { UpdateServiceOrderDetailResponseDto } from './dto/update-service-order-detail-response.dto';
import { UpdateServiceOrderDetailDto } from './dto/update-service-order-detail.dto';

import { AppointmentsService } from '@/appointments/appointments.service';
import { RepairImagesService } from '@/appointments/repair-image.service';
import { DatabaseService } from '@/database/database.service';
import { ServiceOrdersService } from '@/service-orders/service-orders.service';

@Injectable()
export class ServiceOrderDetailsService {
  constructor(
    private prisma: DatabaseService,
    private appointmentService: AppointmentsService,
    private serviceOrderService: ServiceOrdersService,
    private repairImageService: RepairImagesService,
  ) {}

  /**
   * Cập nhật báo giá cho một ServiceOrderDetail.
   *
   * @param id - ID của ServiceOrderDetail cần cập nhật.
   * @param technicianId - ID của kỹ thuật viên thực hiện cập nhật.
   * @param dto - Dữ liệu yêu cầu cập nhật báo giá, bao gồm giá cơ bản, giá bổ sung, chẩn đoán, và ID lịch hẹn.
   * @returns Thông tin chi tiết sau khi cập nhật, bao gồm giá cơ bản, giá bổ sung, giá cuối cùng, ID ServiceOrderDetail và ID lịch hẹn.
   * @throws NotFoundException - Nếu không tìm thấy ServiceOrderDetail, Appointment, hoặc ServiceOrder tương ứng.
   * @throws BadRequestException - Nếu trạng thái lịch hẹn không phù hợp, ServiceOrderDetail và Appointment không thuộc cùng đơn hàng,
   *                               hoặc kỹ thuật viên không phụ trách lịch hẹn.
   */
  async quote(
    id: number,
    technicianId: number,
    dto: UpdateServiceOrderDetailQuoteRequestDto,
  ): Promise<UpdateServiceOrderDetailResponseDto> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // 1. Validate ServiceOrderDetail exists
        const serviceOrderDetail = await prisma.serviceOrderDetail.findUnique({
          where: { id },
        });

        if (!serviceOrderDetail) {
          throw new NotFoundException(`#${id} ServiceOrderDetail not found`);
        }

        // 2. Validate Appointment exists
        const appointment = await prisma.appointment.findUnique({
          where: { id: dto.appointmentId },
        });

        if (!appointment) {
          throw new NotFoundException(`#${id} Appointment not found`);
        }

        // 3. Validate Appointment status
        if (
          appointment.currentStatus !== AppointmentStatusEnum.arrived &&
          appointment.currentStatus !== AppointmentStatusEnum.in_progress
        ) {
          throw new BadRequestException('Trạng thái lịch hẹn không phù hợp để báo giá');
        }

        // 4. Validate ServiceOrder exists
        const serviceOrderId = appointment.serviceOrderId ?? -1;
        const serviceOrder = await prisma.serviceOrder.findUnique({
          where: { id: serviceOrderId },
        });

        if (!serviceOrder) {
          throw new NotFoundException('Lỗi không tìm thấy đơn hàng chứa Appointment cần báo giá');
        }

        // 5. Validate ServiceOrderDetail belongs to same ServiceOrder
        if (appointment.serviceOrderId !== serviceOrderDetail.orderId) {
          throw new BadRequestException('ServiceOrderDetail và Appointment không thuộc cùng đơn hàng!');
        }

        // 6. Validate technician assignment
        if (appointment.technicianId !== technicianId) {
          throw new BadRequestException('Kỹ thuật viên không phụ trách Appointment');
        }

        // 7. Calculate final price
        const finalPrice = dto.basePrice + dto.additionalPrice;

        // 8. Execute updates
        const [updatedDetail, _, __, repairImagesResult] = await Promise.all([
          prisma.serviceOrderDetail.update({
            where: { id },
            data: {
              basePrice: dto.basePrice,
              additionalPrice: dto.additionalPrice,
              finalPrice,
            },
          }),
          prisma.appointment.update({
            where: { id: appointment.id },
            data: {
              currentStatus: AppointmentStatusEnum.quoted,
              diagnosis: dto.diagnosis,
            },
          }),
          prisma.serviceOrder.update({
            where: { id: serviceOrder.id },
            data: {
              totalAmount: (serviceOrder.totalAmount ?? 0) + finalPrice,
            },
          }),
          dto.images?.length > 0
            ? {
                imageCount: dto.images.length,
                images: await Promise.all(
                  dto.images.map((image) =>
                    prisma.repairImage
                      .create({
                        data: {
                          image,
                          image_type: RepairImageTypeEnum.pre,
                          appointmentId: appointment.id,
                        },
                      })
                      .then((img) => ({
                        id: img.id,
                        url: img.image,
                      })),
                  ),
                ),
              }
            : { imageCount: 0, images: [] },
        ]);

        return {
          serviceOrderDetailId: id,
          appointmentId: dto.appointmentId,
          basePrice: updatedDetail.basePrice ?? 0,
          additionalPrice: updatedDetail.additionalPrice ?? 0,
          finalPrice: updatedDetail.finalPrice ?? 0,
          repairImages: repairImagesResult,
          imageCount: repairImagesResult.imageCount,
          images: repairImagesResult.images,
        };
      });
    } catch (error) {
      console.error(`Failed to update quote: `, error);
      throw error;
    }
  }

  /**
   * Lấy thông tin bảo hành của các dịch vụ khách hàng đã sử dụng
   * @param userId
   */
  async findAllServiceWarranty(userId: number): Promise<ServiceWarrantyResponseDto[]> {
    const serviceOrders = await this.prisma.serviceOrder.findMany({
      where: { customerId: userId },
      select: {
        serviceOrderDetails: {
          select: {
            id: true,
            service: {
              select: {
                name: true,
                ServiceImages: {
                  select: {
                    image_url: true,
                  },
                  take: 1,
                },
              },
            },
            serviceWarranty: {
              select: {
                id: true,
                start_date: true,
                end_date: true,
                status: true,
                claims_count: true,
              },
            },
          },
          where: {
            serviceWarranty: { isNot: null },
          },
        },
      },
    });

    if (!serviceOrders || serviceOrders.length === 0) {
      return [];
    }

    const currentDate = new Date();

    return serviceOrders.flatMap((order) =>
      order.serviceOrderDetails
        .filter((detail) => detail.serviceWarranty)
        .map((detail) => {
          const warranty = detail.serviceWarranty!;
          const endDate = new Date(warranty.end_date);
          const remainingDays = Math.max(
            0,
            Math.floor((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)),
          );

          return {
            warrantyId: warranty.id,
            orderDetail: {
              id: detail.id,
              serviceName: detail.service.name,
              serviceImage: detail.service.ServiceImages[0]?.image_url,
            },
            warrantyInfo: {
              startDate: warranty.start_date,
              endDate: warranty.end_date,
              remainingDays,
              status: warranty.status,
              claimCount: warranty.claims_count,
            },
          };
        }),
    );
  }

  create(createServiceOrderDetailDto: CreateServiceOrderDetailDto) {
    return 'This action adds a new serviceOrderDetail';
  }

  findAll() {
    return `This action returns all serviceOrderDetails`;
  }

  async findById(id: number): Promise<Partial<ServiceOrderDetail> | null> {
    const orderDetail = await this.prisma.serviceOrderDetail.findUnique({
      where: { id },
    });

    if (!orderDetail) {
      return null;
    }

    return orderDetail;
  }

  update(id: number, updateServiceOrderDetailDto: UpdateServiceOrderDetailDto) {
    return `This action updates a #${id} serviceOrderDetail`;
  }

  async updatePartial(
    id: number,
    data: Prisma.ServiceOrderDetailUpdateInput, // Sử dụng chính xác kiểu Prisma generate
  ): Promise<Partial<ServiceOrderDetail>> {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    ) as Prisma.ServiceOrderDetailUpdateInput;

    const serviceOrderDetail = await this.prisma.serviceOrderDetail.update({
      where: { id },
      data: filteredData,
    });

    return serviceOrderDetail;
  }

  remove(id: number) {
    return `This action removes a #${id} serviceOrderDetail`;
  }
}
