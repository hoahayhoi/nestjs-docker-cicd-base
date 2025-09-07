import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ServiceOrderStatusEnum } from '@prisma/client';

import { CreateReviewDto, ReviewResponseDto } from './dto/create-review.dto';

import { DatabaseService } from '@/database/database.service';
import { TechniciansService } from '@/technicians/technicians.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: DatabaseService,
    private technicianService: TechniciansService,
  ) {}
  async customerCreate(userId: number, dto: CreateReviewDto): Promise<ReviewResponseDto> {
    // check service order detail exist
    const serviceOrderDetail = await this.prisma.serviceOrderDetail.findUnique({
      where: { id: dto.serviceOrdersDetailId },
    });

    if (!serviceOrderDetail) {
      throw new BadRequestException('ServiceOrderDetail not exits');
    }
    // check user is the owner of the service order
    const serviceOrder = await this.prisma.serviceOrder.findUnique({
      where: { id: serviceOrderDetail.orderId },
    });

    if (!serviceOrder) {
      throw new NotFoundException('The Service Order that contain the detail is not found');
    }

    if (serviceOrder.customerId !== userId) {
      throw new BadRequestException('Customer does not owne the Service Order');
    }

    // check status service order
    if (serviceOrder.status !== ServiceOrderStatusEnum.completed) {
      throw new BadRequestException('The service order still not be completed to review!');
    }

    // check the order detail still or not have review yet
    const existingReview = await this.prisma.review.findFirst({
      where: {
        serviceOrdersDetailId: dto.serviceOrdersDetailId,
        userId: userId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this service order');
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      // Tạo review và lưu kết quả
      const createdReview = await prisma.review.create({
        data: {
          serviceOrdersDetailId: dto.serviceOrdersDetailId,
          userId: userId,
          technicianId: dto.technicianId,
          rating: dto.rating,
          comment: dto.comment,
          isAnonymous: dto.isAnonymous,
          mediaList: dto.mediaList ? JSON.stringify(dto.mediaList) : null,
        },
      });

      // Cập nhật thống kê kỹ thuật viên
      const technician = await prisma.technicians.findUnique({
        where: { id: createdReview.technicianId },
      });

      if (!technician) {
        throw new Error('Technician not found');
      }

      const currentTotalRating = Number(technician.average_rating) * technician.total_review;
      const newTotalReview = technician.total_review + 1;
      const newAverageRating = (currentTotalRating + createdReview.rating) / newTotalReview;

      await prisma.technicians.update({
        where: { id: createdReview.technicianId },
        data: {
          average_rating: newAverageRating,
          total_review: newTotalReview,
        },
      });

      // Trả về kết quả bạn muốn (ở đây trả về createdReview)
      return createdReview;
    });

    // return result map to review response dto
    return {
      id: result.id,
      rating: result.rating,
      comment: result.comment,
      isAnonymous: result.isAnonymous,
      mediaList: result.mediaList ? (JSON.parse(result.mediaList) as string[]) : [],
      userId: result.userId,
      technicianId: result.technicianId,
      serviceOrdersDetailId: result.serviceOrdersDetailId,
      createdAt: new Date(),
    };
  }

  // create(createReviewDto: CreateReviewDto) {
  //   return 'This action adds a new review';
  // }

  // findAll() {
  //   return `This action returns all reviews`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} review`;
  // }

  // update(id: number, updateReviewDto: UpdateReviewDto) {
  //   return `This action updates a #${id} review`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} review`;
  // }
}
