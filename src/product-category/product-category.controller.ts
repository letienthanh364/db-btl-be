import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryCreateDto } from './dtos/product-category.create.dto';
import { ProductCategorySearchDto } from './dtos/product-category.search.dto';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';

@Controller('product-category')
export class ProductCategoryController {
  constructor(private readonly categoryService: ProductCategoryService) {}

  @Post('')
  async create(@Body() data: ProductCategoryCreateDto[]) {
    return this.categoryService.create(data);
  }

  @Get()
  getAllCategories() {
    return this.categoryService.getAllCategories();
  }
}
