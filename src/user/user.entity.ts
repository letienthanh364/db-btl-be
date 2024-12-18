import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base_entity';
import { ApiProperty, PickType, OmitType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Address } from 'src/address/address.entity';

@Entity('User')
export class User extends BaseEntity {
  @ApiProperty({ description: 'Username of the user' })
  @Column({ type: 'varchar', unique: true })
  username: string;

  @ApiProperty({ description: 'Password of the user' })
  @Column({ type: 'varchar' })
  password: string;

  @ApiProperty({ description: 'Registration date of the user' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  registrationDate: Date;

  @ApiProperty({ description: 'First name of the user' })
  @Column({ type: 'varchar' })
  firstName: string;

  @ApiProperty({ description: 'Last name of the user' })
  @Column({ type: 'varchar' })
  lastName: string;

  @ApiProperty({ description: 'Gender of the user' })
  @Column({ type: 'varchar' })
  gender: string;

  @ApiProperty({ description: 'Email of the user' })
  @Column({ type: 'varchar', unique: true })
  email: string;

  @ApiProperty({ description: 'Phone number of the user' })
  @Column({ type: 'varchar' })
  phone: string;

  @OneToMany(() => Address, (address) => address.user, { nullable: true })
  addresses: Address[];
}

export class Customer extends PickType(User, [
  'username',
  'firstName',
  'lastName',
  'email',
  'phone',
]) {}

export class UserSimple extends PickType(User, ['id', 'username', 'email']) {}
