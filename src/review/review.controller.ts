import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewCreateDto } from './dtos/review.create.dto';
import { ReviewSearchDto } from './dtos/review.search.dto';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('')
  async create(@Body() data: ReviewCreateDto) {
    return this.reviewService.create(data);
  }

  @Get('')
  async search(
    @Query('user_id') user_id?: string,
    @Query('product_id') product_id?: string,
    @Query('parent_id') parent_id?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = PAGINATION_LIMIT,
  ) {
    const searchDto: ReviewSearchDto = {
      user_id,
      product_id,
      parent_id,
      page: page || 1,
      limit: limit || PAGINATION_LIMIT,
    };
    return this.reviewService.search(searchDto);
  }

  @Get(':id')
  async getById(@Param() id: string) {
    return this.reviewService.findOne(id);
  }
}
