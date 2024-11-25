import { Optional } from '@nestjs/common';
import { BaseEntity } from 'src/common/base_entity';
import { Column, Entity, UpdateDateColumn } from 'typeorm';

@Entity('ProductCategory')
export class ProductCategory extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'varchar' })
  description: string;
}
