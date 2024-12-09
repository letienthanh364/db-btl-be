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

  @Post('')
  async create(@Body() data: ProductCreateDto[]) {
    return this.productService.create(data);
  }

  @Get('')
  async search(
    @Query('name') name?: string,
    @Query('keyword') keyword?: string,
    @Query('price') price?: number,
    @Query('reorder_point') reorder_point?: number,
    @Query('description') description?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
    @Query('minQuantity') minQuantity?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const searchDto: ProductSearchDto = {
      name,
      keyword,
      price,
      reorder_point,
      description,
      sort,
      minQuantity,
      category: category && category.toLowerCase(),
      page: page || 1,
      limit: limit || PAGINATION_LIMIT,
    };
    return this.productService.search(searchDto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() productData: Partial<ProductCreateDto>,
  ) {
    return this.productService.update(id, productData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.productService.delete(id);
    return {
      message: `Product with ID "${id}" has been deleted successfully.`,
    };
  }
}
