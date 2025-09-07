import { BadRequestException, Injectable } from '@nestjs/common';
import { RepairImageTypeEnum } from '@prisma/client';

import { AppointmentsService } from './appointments.service';
import { AddImagesToRepairImageResponseDto } from './dto/add-images-to-repair-image.dto';

import { DatabaseService } from '@/database/database.service';
// import * as removeAccents from 'remove-accents';

@Injectable()
export class RepairImagesService {
  constructor(
    private prisma: DatabaseService,
    private appointmentService: AppointmentsService,
  ) {}

  async createMany(
    images: string[],
    appointmentId: number,
    imageType: RepairImageTypeEnum,
  ): Promise<AddImagesToRepairImageResponseDto | null> {
    try {
      if (!images || images.length === 0) {
        return null;
      }

      const appointment = await this.appointmentService.findById(appointmentId);

      if (!appointment) {
        throw new BadRequestException('Images do not belong to any Appointment!');
      }

      const data = images.map((image) => ({
        image,
        image_type: imageType,
        appointmentId,
      }));

      const repairImages = await Promise.all(
        data.map((item) =>
          this.prisma.repairImage.create({
            data: item,
          }),
        ),
      );

      return {
        count: repairImages.length,
        repairImages: repairImages.map((item) => ({
          id: item.id,
          image: item.image,
          image_type: item.image_type,
        })),
      };
    } catch (error) {
      console.error('Error creating repair images:', error);
      throw new Error('Failed to create images in RepairImage table');
    }
  }

  // create(createServiceDto: CreateServiceDto) {
  //   return 'This action adds a new service';
  // }

  // findAll() {
  //   return `This action returns all services`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} service`;
  // }

  // update(id: number, updateServiceDto: UpdateServiceDto) {
  //   return `This action updates a #${id} service`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} service`;
  // }

  //   async findById(id: number): Promise<ServicesDto | null> {

  //   }
}
