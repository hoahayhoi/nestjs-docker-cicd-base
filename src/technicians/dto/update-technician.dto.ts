import { PartialType } from '@nestjs/swagger';

import { CreateTechnicianDto } from './create-technician.dto';

export class UpdateTechnicianDto extends PartialType(CreateTechnicianDto) {}

export class UpdateTechnicianRatingResponseDto {
  id: number;
  average_rating: number;
  total_review: number;
}
