import { Controller, Post, Body, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateReviewDto, ReviewResponseDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

import { Permissions } from '@/auth/decorators/permissions.decorator';
import { Permission } from '@/auth/decorators/permissions.enum';

@ApiBearerAuth()
@ApiTags('Reviews-Customer')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Permissions(Permission.UpdateServiceOrderDetail, Permission.CreateReview)
  @ApiOperation({ summary: 'Đánh giá dịch vụ sau khi hoàn thành' })
  @ApiResponse({
    status: 200,
    description: 'Đánh giá dịch vụ thành công',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ServiceOrderDetail not found' })
  async customerCreate(
    @Request() request: { user: { _id: number } },
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const userId = request.user._id;

    return await this.reviewsService.customerCreate(userId, dto);
  }

  // @Post()
  // create(@Body() createReviewDto: CreateReviewDto) {
  //   return this.reviewsService.create(createReviewDto);
  // }

  // @Get()
  // findAll() {
  //   return this.reviewsService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.reviewsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
  //   return this.reviewsService.update(+id, updateReviewDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.reviewsService.remove(+id);
  // }
}
