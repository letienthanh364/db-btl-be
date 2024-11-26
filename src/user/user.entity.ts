import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../common/base_entity';
import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { UserRole } from 'src/common/decorator/user_role';
import { IsOptional } from 'class-validator';
import { Membership } from 'src/membership/membership.entity';

@Entity('User')
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
  })
  name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

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

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ type: 'varchar', nullable: true, default: '' })
  department: string;

  @Column({ type: 'varchar', nullable: true, default: '' })
  position: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  point: string;

  @ManyToOne(() => Membership, { nullable: true })
  @JoinColumn({ name: 'membership_id', referencedColumnName: 'id' })
  membership: Membership;
}

export class Employee extends OmitType(User, ['point']) {}

export class Customer extends OmitType(User, [
  'department',
  'position',
  'authority_group',
]) {}

export class UserSimple extends PickType(User, ['id', 'name']) {}
