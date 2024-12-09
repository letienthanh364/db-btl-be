import { PickType, PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../product.entity';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';
import { Optional } from '@nestjs/common';

export class ProductSearchDto extends PartialType(
  PickType(Product, ['name', 'price', 'reorder_point', 'description'] as const),
) {
  @Optional()
  category?: string;

  @Optional()
  keyword?: string;

  @Optional()
  sort?: string;

  @Optional()
  minQuantity?: number;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: PAGINATION_LIMIT,
    default: PAGINATION_LIMIT,
  })
  limit?: number;
}
