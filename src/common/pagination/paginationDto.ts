import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatorTypes, paginator } from '@nodeteam/nestjs-prisma-pagination';
import { Transform } from 'class-transformer';
import { IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Số trang hiện tại',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Số lượng bản ghi trên mỗi trang',
    example: 10,
  })
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsOptional()
  @IsInt()
  @Min(1)
  perPage?: number;

  @ApiPropertyOptional({
    description: 'Lực theo tên người dùng',
    example: 'John Doe',
  })
  @IsOptional()
  where?: string;

  @ApiPropertyOptional({
    description: 'Trường để sắp xếp dữ liệu',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  orderKey?: string;

  @ApiPropertyOptional({
    description: 'Giá trị để sắp xếp dữ liệu (theo thứ tự tăng dần hoặc giảm dần)',
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  orderValue?: 'asc' | 'desc' = 'desc';
}

export const createPaginator = (page = 1, perPage = 10): PaginatorTypes.PaginateFunction => {
  return paginator({ page, perPage });
};
