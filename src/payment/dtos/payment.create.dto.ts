import { PickType } from '@nestjs/swagger';
import { Payment } from '../payment.entity';

export class PaymentCreateDto extends PickType(Payment, [
  'amount',
  'currency',
] as const) {
  order_id: string;
}
