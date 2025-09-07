import { ApiProperty } from '@nestjs/swagger';
import { WarrantyUnit } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

export class CreateServiceImageDto {
  @ApiProperty({
    description: 'URL of the service image',
    example: 'https://example.com/service-image.jpg',
  })
  @IsUrl()
  @IsNotEmpty()
  image_url: string;
}

export class CreateServiceDto {
  @ApiProperty({
    description: 'Name of the service',
    example: 'Washing Repair',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'ID of the category this service belongs to',
    example: 1,
    required: true,
  })
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({
    description: 'Description of the service',
    example: 'Professional laptop repair service for all brands',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiProperty({
    description: 'Base price of the service',
    example: 1000000,
    required: true,
  })
  @IsInt()
  @IsNotEmpty()
  base_price: number;

  @ApiProperty({
    description: 'Whether the service is active',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({
    description: 'Warranty period for the service',
    example: 12,
    required: false,
  })
  @IsInt()
  @IsOptional()
  warranty_period?: number;

  @ApiProperty({
    description: 'Unit of the warranty period',
    example: 'months',
    enum: ['days', 'months', 'years'],
    required: false,
  })
  @IsString()
  @IsOptional()
  warranty_unit?: WarrantyUnit;

  @ApiProperty({
    description: 'URL of the service icon',
    example: 'https://example.com/service-icon.png',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  icon_url?: string;

  @ApiProperty({
    description: 'Array of service images',
    type: [CreateServiceImageDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceImageDto)
  @IsOptional()
  images?: CreateServiceImageDto[] | null;
}

export class ServiceImageResponse {
  @ApiProperty({
    description: 'ID of the service image',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'URL of the service image',
    example: 'https://example.com/service-image.jpg',
  })
  image_url: string;

  @ApiProperty({
    description: 'ID of the service this image belongs to',
    example: 1,
  })
  service_id: number;
}

export class ServiceCategoryResponse {
  @ApiProperty({
    description: 'ID of the service category',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Name of the service category',
    example: 'Electronics Repair',
  })
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug for the category',
    example: 'electronics-repair',
  })
  slug: string;

  @ApiProperty({
    description: 'Type of device this category applies to',
    example: 'Laptop',
  })
  deviceType: string;
}

export class ServiceResponse {
  @ApiProperty({
    description: 'ID of the service',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Name of the service',
    example: 'Laptop Repair',
  })
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug for the service',
    example: 'laptop-repair',
  })
  slug: string;

  @ApiProperty({
    description: 'ID of the category this service belongs to',
    example: 1,
    required: true,
  })
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({
    description: 'Average rating of the service',
    example: 4.5,
  })
  average_rating: number;

  @ApiProperty({
    description: 'Number of reviews for the service',
    example: 42,
  })
  review_count: number;

  @ApiProperty({
    description: 'Description of the service',
    example: 'Professional laptop repair service for all brands',
  })
  description: string;

  @ApiProperty({
    description: 'Base price of the service',
    example: 1000000,
  })
  base_price: number;

  @ApiProperty({
    description: 'Whether the service is active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Date when the service was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Date when the service was last updated',
    example: '2023-01-02T00:00:00.000Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Warranty period for the service',
    example: 12,
  })
  warranty_period: number;

  @ApiProperty({
    description: 'Unit of the warranty period',
    example: 'month',
    enum: ['day', 'month', 'year'],
  })
  warranty_unit: WarrantyUnit;

  @ApiProperty({
    description: 'URL of the service icon',
    example: 'https://example.com/service-icon.png',
    nullable: true,
  })
  icon_url?: string | null;

  @ApiProperty({
    description: 'Array of service images',
    type: [ServiceImageResponse],
  })
  images?: ServiceImageResponse[] | null;
}
