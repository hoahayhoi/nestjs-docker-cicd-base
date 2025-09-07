import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { SparePart, SparePartCategory } from '@prisma/client';

import { SparePartsService } from './spare-parts.service';

import { Public, ResponseMessage } from '@/common/decorator/customize';
import { BaseResponseDto } from '@/common/dtos/base-response.dto';
import { PaginationDto } from '@/common/pagination/paginationDto';

@ApiTags('Spare-Parts-Customer')
@ApiBearerAuth()
@Controller('spare-parts')
export class CustomerSparePartsController {
  constructor(private readonly sparePartsService: SparePartsService) {}

  @Get('category/:id')
  @Public()
  @ApiOperation({ summary: 'Lấy linh kiện theo categoryId' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID của danh mục linh kiện cần lấy',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy các linh kiện thành công',
    type: BaseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'SpareParts not found' })
  @ResponseMessage('Lấy linh kiện theo ID thành công')
  async getByCategoryId(@Param('id') id: number): Promise<Partial<SparePart>[]> {
    return this.sparePartsService.getByCategoryId(id);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Lấy các loại linh kiện' })
  @ApiResponse({
    status: 200,
    description: 'Lấy loại linh kiện thành công',
    type: BaseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tồn lại linh kiện nào' })
  @ResponseMessage('Lấy các loại linh kiện thành công!')
  async getAllCategories(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatorTypes.PaginatedResult<Partial<SparePartCategory>>> {
    return this.sparePartsService.getAllCategories(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy linh kiện theo ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID của linh kiện cần lấy',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy linh kiện thành công',
    type: BaseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'SparePart not found' })
  @Public()
  @ResponseMessage('Lấy linh kiện theo ID thành công')
  async findById(@Param('id') id: number): Promise<Partial<SparePart>> {
    const result = await this.sparePartsService.findById(id);

    if (!result) {
      throw new NotFoundException('Spare part not found!');
    }

    return result;
  }
}
