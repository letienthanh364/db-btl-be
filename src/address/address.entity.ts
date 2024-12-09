import { Optional } from '@nestjs/common';
import { BaseEntity } from 'src/common/base_entity';
import { User } from 'src/user/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('Address')
export class Address extends BaseEntity {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'boolean', default: false })
  default_flag: boolean;

  @Column({ type: 'varchar' })
  city: string;

  @Column({ type: 'varchar' })
  district: string;

  @Optional()
  @Column({ type: 'varchar', default: '' })
  other_details: string;
}
