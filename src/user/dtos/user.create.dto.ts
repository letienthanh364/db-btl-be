import { PickType } from '@nestjs/swagger';
import { User } from '../user.entity';

export class UserCreateDto extends PickType(User, [
  'name',
  'email',
  'password',
  'authority_group',
  'department',
  'position',
] as const) {
  membership_id: string;
}

export class UserRegisterDto extends PickType(User, [
  'email',
  'name',
  'phone',
  'password',
] as const) {}
