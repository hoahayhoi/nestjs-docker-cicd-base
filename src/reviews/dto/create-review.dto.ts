import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, IsBoolean, IsArray, ValidateNested } from 'class-validator';

class MediaItemDto {
  @ApiProperty({ example: 'image.jpg', description: 'URL or base64 of media' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ example: 'image', enum: ['image', 'video'], description: 'Media type' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class CreateReviewDto {
  @ApiProperty({ example: 1, description: 'ID of the service order detail' })
  @IsInt()
  @IsNotEmpty()
  serviceOrdersDetailId: number;

  @ApiProperty({ example: 1, description: 'ID of the technician' })
  @IsInt()
  @IsNotEmpty()
  technicianId: number;

  @ApiProperty({
    example: 5,
    description: 'Rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    example: 'Very professional service!',
    description: 'Review comment',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Post as anonymous',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean = true;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of media items',
    example: ['image.jpg'],
  })
  @IsOptional()
  @IsArray()
  mediaList?: string[] | null;
}

export class ReviewResponseDto {
  @ApiProperty({ example: 1, description: 'Review ID' })
  id: number;

  @ApiProperty({ example: 5, description: 'Rating value (1-5)' })
  rating: number;

  @ApiPropertyOptional({
    example: 'Great service!',
    description: 'Review comment',
    nullable: true,
  })
  comment: string | null;

  @ApiProperty({
    example: true,
    description: 'Is review anonymous?',
  })
  isAnonymous: boolean;

  @ApiPropertyOptional({
    type: [Object],
    example: [{ url: 'image1.jpg', type: 'image' }],
    description: 'Attached media files',
    nullable: true,
  })
  mediaList: string[] | null;

  @ApiProperty({
    description: 'User id',
  })
  userId: number;

  @ApiProperty({
    description: 'Technician id',
  })
  technicianId: number;

  @ApiProperty({
    description: 'Service order details id',
  })
  serviceOrdersDetailId: number;

  @ApiProperty({
    example: '2023-05-20T10:00:00Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;
}
