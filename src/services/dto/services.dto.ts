import { ApiProperty } from '@nestjs/swagger';

export class GetServiceDto {
  @ApiProperty({ description: 'ID của dịch vụ cần lấy thông tin', example: 1 })
  id: number;
}

export class GetServiceCategoriesDto {
  id: number;
  name: string;
  basePrice: number;
}

// export class ServicesTypeDto {
//   @ApiProperty()
//   id: number;

//   @ApiProperty()
//   name: string;

//   @ApiProperty({ type: [ServicesDto] })
//   services: ServicesDto[];
// }

export class ServiceImageDto {
  @ApiProperty({
    description: 'ID của hình ảnh dịch vụ',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID của dịch vụ liên quan',
    example: 5,
    type: Number,
  })
  service_id: number;

  @ApiProperty({
    description: 'URL hình ảnh dịch vụ',
    example: 'https://example.com/service-images/pet-grooming.jpg',
    type: String,
    format: 'uri',
  })
  image_url: string;
}

export class ServicesDto {
  @ApiProperty({
    description: 'ID của dịch vụ',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Tên dịch vụ',
    example: 'Cắt tỉa lông thú cưng',
    type: String,
    maxLength: 255,
  })
  name: string;

  @ApiProperty({
    description: 'Mô tả chi tiết dịch vụ',
    example: 'Dịch vụ cắt tỉa lông chuyên nghiệp cho thú cưng',
    type: String,
    required: false,
  })
  description: string;

  @ApiProperty({
    description: 'Điểm đánh giá trung bình (từ 1-5)',
    example: 4.5,
    type: Number,
    minimum: 1,
    maximum: 5,
  })
  average_rating: number;

  @ApiProperty({
    description: 'Tổng số lượt đánh giá',
    example: 15,
    type: Number,
  })
  review_count: number;

  @ApiProperty({
    description: 'Giá cơ bản của dịch vụ',
    example: 150000,
    type: Number,
  })
  base_price: number;

  @ApiProperty({
    description: 'Danh sách hình ảnh dịch vụ',
    type: [ServiceImageDto],
    example: [
      {
        id: 1,
        url: 'https://example.com/image1.jpg',
        alt_text: 'Hình ảnh dịch vụ 1',
      },
      {
        id: 2,
        url: 'https://example.com/image2.jpg',
        alt_text: 'Hình ảnh dịch vụ 2',
      },
    ],
  })
  images: ServiceImageDto[];
}
