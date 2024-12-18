import { PickType } from '@nestjs/swagger';
import { User } from '../user.entity';

export class UserCreateDto extends PickType(User, [
  'username',
  'firstName',
  'lastName',
  'email',
  'phone',
  'password',
  'gender',
] as const) {}

export class UserRegisterDto extends PickType(User, [
  'username',
  'firstName',
  'lastName',
  'email',
  'phone',
  'password',
  'gender',
] as const) {}
