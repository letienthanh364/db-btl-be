import { PickType } from '@nestjs/swagger';
import { Address } from '../address.entity';

export class AddressCreateDto extends PickType(Address, [
  'default_flag',
  'city',
  'district',
  'other_details',
] as const) {}
