import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  Customer = 'customer',
  Employee = 'employee',
  Manager = 'manager',
  Admin = 'admin',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
