import { PickType } from '@nestjs/swagger';
import { Membership } from '../membership.entity';

export class MembershipCreateDto extends PickType(Membership, [
  'name',
  'deduct_rate',
  'deduct_limit',
] as const) {}
