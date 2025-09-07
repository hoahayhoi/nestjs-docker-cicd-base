import type { RepairImageTypeEnum } from '@prisma/client';

export class RepairImageDto {
  id: number;
  image: string;
  image_type: RepairImageTypeEnum;
}

export class AddImagesToRepairImageResponseDto {
  count: number;
  repairImages: RepairImageDto[];
}
