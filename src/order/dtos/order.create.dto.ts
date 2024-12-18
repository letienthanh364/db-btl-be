import { PickType } from '@nestjs/swagger';
import { Order } from '../order.entity';

export class OrderCreateDto extends PickType(Order, [
  'address',
  'customerName',
  'customerPhone',
  'customerEmail',
  'province',
  'district',
  'commune',
  'address',
  'housingType',
]) {
  user_id: string;

  orderProducts: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}
