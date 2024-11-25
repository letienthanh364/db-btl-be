import { PickType } from '@nestjs/swagger';
import { ProductCategory } from '../product-category.entity';

export class ProductCategoryCreateDto extends PickType(ProductCategory, [
  'name',
  'description',
] as const) {}
