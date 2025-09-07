import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';

import { ServiceResponse } from './dto/create-service.dto';
import { GetServiceCategoriesDto, ServicesDto } from './dto/services.dto';
import { ServicesService } from './services.service';

import { Public } from '@/common/decorator/customize';
import { PaginationDto } from '@/common/pagination/paginationDto';

@ApiTags('Services-Customer')
@ApiBearerAuth()
@Controller('services')
export class CustomerServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @ApiOperation({ summary: 'Lấy các dịch vụ' })
  @Get()
  @Public()
  async getAllServices(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatorTypes.PaginatedResult<Omit<ServicesDto, 'description'>>> {
    return this.servicesService.getAllServices(paginationDto);
  }

  @ApiOperation({ summary: 'Lấy các loại dịch vụ' })
  @Get('categories')
  @Public()
  async getAllServiceCategories(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatorTypes.PaginatedResult<GetServiceCategoriesDto>> {
    return this.servicesService.getAllServiceCategories(paginationDto);
  }

  @ApiOperation({ summary: 'Lấy dịch vụ theo ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID của dịch vụ cần lấy',
    example: 1,
  })
  @ApiOkResponse({ description: 'Trả về thông tin chi tiết của dịch vụ' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy dịch vụ' })
  @Public()
  @Get(':id')
  async getServiceById(@Param('id') id: number): Promise<ServiceResponse | null> {
    return this.servicesService.findById(id);
  }

  @ApiOperation({ summary: 'Lấy dịch vụ theo slug' })
  @ApiParam({
    name: 'slug',
    type: String,
    description: 'Slug của dịch vụ cần lấy',
    example: 'example-slug',
  })
  @ApiOkResponse({ description: 'Trả về thông tin chi tiết của dịch vụ' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy dịch vụ' })
  @Public()
  @Get('by-slug/:slug')
  async getServiceBySlug(@Param('slug') slug: string): Promise<ServiceResponse | null> {
    return this.servicesService.findBySlug(slug);
  }
}
