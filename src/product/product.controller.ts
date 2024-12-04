import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductCreateDto } from './dtos/product.create.dto';
import { ProductSearchDto } from './dtos/product.search.dto';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('')
  async create(@Body() data: ProductCreateDto[]) {
    return this.productService.create(data);
  }

  @Get('')
  async search(
    @Query('name') name?: string,
    @Query('price') price?: number,
    @Query('reorder_point') reorder_point?: string,
    @Query('description') description?: string,
    @Query('category') category?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const searchDto: ProductSearchDto = {
      name,
      price,
      reorder_point,
      description,
      category: category && category.toLowerCase(),
      page: page || 1,
      limit: limit || PAGINATION_LIMIT,
    };
    return this.productService.search(searchDto);
  }

  @Get(':id')
  async getById(@Param() id: string) {
    return this.productService.findOne(id);
  }
}
