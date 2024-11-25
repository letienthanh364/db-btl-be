import { PickType, PartialType } from '@nestjs/swagger';
import { Address } from '../address.entity';

export class AddressSearchDto extends PartialType(
  PickType(Address, ['default_flag', 'city', 'district'] as const),
) {}
