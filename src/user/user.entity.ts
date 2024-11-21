import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/base_entity';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { UserRole } from 'src/common/decorator/user_role';
import { IsOptional } from 'class-validator';

@Entity('User')
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
  })
  name: string;

  @Column({ type: 'varchar', unique: true })
  username: string;

  @Column({ type: 'varchar' })
  password: string;

  @ApiProperty({ description: 'The role of the user', enum: UserRole })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.Customer,
  })
  @IsOptional()
  authority_group: UserRole;

  @Column({ type: 'int', default: 0 })
  available_pages: number;
}

export class UserSimple extends PickType(User, [
  'id',
  'name',
  'available_pages',
]) {}
