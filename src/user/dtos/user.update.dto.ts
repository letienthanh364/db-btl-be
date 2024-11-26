import { PartialType, PickType } from '@nestjs/swagger';
import { User } from '../user.entity';
import { Optional } from '@nestjs/common';

export class UserUpdateDto extends PartialType(
  PickType(User, [
    'id',
    'name',
    'authority_group',
    'department',
    'position',
  ] as const),
) {
  @Optional()
  membership_id: string;
}
