import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryCreateDto } from './dtos/product-category.create.dto';
import { ProductCategorySearchDto } from './dtos/product-category.search.dtp';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';

@Controller('product-category')
export class ProductCategoryController {
  constructor(private readonly categoryService: ProductCategoryService) {}

  @Post('')
  async create(@Body() data: ProductCategoryCreateDto[]) {
    console.log(data);
    return this.categoryService.create(data);
  }

  @Get('')
  async search(
    @Query('name') name?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const searchDto: ProductCategorySearchDto = {
      name,
      page: page || 1,
      limit: limit || PAGINATION_LIMIT,
    };
    return this.categoryService.search(searchDto);
  }

  @Get(':id')
  async getById(@Param() id: string) {
    return this.categoryService.findOne(id);
  }
}
