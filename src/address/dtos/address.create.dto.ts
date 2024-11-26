import { PickType } from '@nestjs/swagger';
import { Address } from '../address.entity';

export class AddressCreateDto extends PickType(Address, [
  'default_flag',
  'city',
  'district',
  'order_details',
] as const) {}