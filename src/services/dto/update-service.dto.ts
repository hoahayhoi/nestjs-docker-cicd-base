import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { CreateServiceDto, CreateServiceImageDto } from './create-service.dto';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @ApiProperty({
    description: 'Array of image IDs to delete',
    type: [Number],
    required: false,
  })
  @IsArray()
  @IsOptional()
  imagesToDelete?: number[];

  @ApiProperty({
    description: 'Array of service images',
    type: [CreateServiceImageDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceImageDto)
  @IsOptional()
  newImages?: CreateServiceImageDto[] | null;
}
