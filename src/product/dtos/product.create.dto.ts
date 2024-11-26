import { PickType } from '@nestjs/swagger';
import { Product } from '../product.entity';

export class ProductCreateDto extends PickType(Product, [
  'name',
  'description',
  'price',
  'inventory_quantity',
  'image_url',
  'reorder_point',
] as const) {
  category_id: string;
}
