import { Optional } from '@nestjs/common';
import { BaseEntity } from 'src/common/base_entity';
import { Column, Entity, UpdateDateColumn } from 'typeorm';

@Entity('Membership')
export class Membership extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'float' })
  deduct_rate: number;

  @Column({ type: 'float' })
  deduct_limit: number;

  @Column({ type: 'varchar' })
  deduct_available: number;

  @UpdateDateColumn()
  renew_date: Date;
}
