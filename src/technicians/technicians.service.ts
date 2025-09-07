import { Injectable } from '@nestjs/common';
import { Technicians } from '@prisma/client';

import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';

import { DatabaseService } from '@/database/database.service';

@Injectable()
export class TechniciansService {
  constructor(private prisma: DatabaseService) {}

  create(createTechnicianDto: CreateTechnicianDto) {
    return 'This action adds a new technician';
  }

  findAll() {
    return `This action returns all technicians`;
  }

  findOne(id: number) {
    return `This action returns a #${id} technician`;
  }

  async findByUserId(id: number): Promise<Partial<Technicians> | null> {
    const technician = await this.prisma.technicians.findUnique({
      where: { user_id: id },
    });

    if (!technician) return null;

    return technician;
  }

  async updateTechnicianRating(technicianId: number, newRating: number) {
    const technician = await this.prisma.technicians.findUnique({
      where: { id: technicianId },
    });

    if (!technician) {
      throw new Error('Technician not found');
    }

    // caculate the new Avaverage Rating
    const currentTotalRating = Number(technician.average_rating) * technician.total_review;
    const newTotalReview = technician.total_review + 1;
    const newAverageRating = (currentTotalRating + newRating) / newTotalReview;

    // update technician
    return this.prisma.technicians.update({
      where: { id: technicianId },
      data: {
        average_rating: newAverageRating,
        total_review: newTotalReview,
      },
    });
  }

  update(id: number, updateTechnicianDto: UpdateTechnicianDto) {
    return `This action updates a #${id} technician`;
  }

  remove(id: number) {
    return `This action removes a #${id} technician`;
  }
}
