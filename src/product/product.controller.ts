import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductCreateDto } from './dtos/product.create.dto';
import { ProductSearchDto } from './dtos/product.search.dto';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('')
  async search(
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('size') size?: string,
    @Query('color') color?: string,
    @Query('priceMin') priceMin?: number,
    @Query('priceMax') priceMax?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const searchDto: ProductSearchDto = {
      keyword,
      priceMin,
      priceMax,
      size,
      color,
      category: category && category.toLowerCase(),
      page: page || 1,
      limit: limit || PAGINATION_LIMIT,
    };
    return this.productService.searchProducts(searchDto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.productService.findOne(id);
  }
}
