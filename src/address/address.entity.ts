import { Optional } from '@nestjs/common';
import { BaseEntity } from 'src/common/base_entity';
import { Column, Entity } from 'typeorm';

@Entity('Address')
export class Address extends BaseEntity {
  @Column({ type: 'varchar' })
  default_flag: string;

  @Column({ type: 'varchar' })
  city: string;

  @Column({ type: 'varchar' })
  district: string;

  @Optional()
  @Column({ type: 'varchar', default: '' })
  order_details: string;
}
