import { PickType } from '@nestjs/swagger';
import { Product } from '../product.entity';

export class ProductCreateDto extends PickType(Product, [
  'name',
  'description',
  'price',
  'color',
  'size',
  'genderSuit',
  'model',
  'branch',
  'imageUrl',
  'inventoryQuantity',
  'discount',
] as const) {
  category_id: string;
}
