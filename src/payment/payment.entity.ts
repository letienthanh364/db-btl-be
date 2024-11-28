import { Optional } from '@nestjs/common';
import { BaseEntity } from 'src/common/base_entity';
import { Order } from 'src/order/order.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity('Payment')
export class Payment extends BaseEntity {
  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id', referencedColumnName: 'id' })
  order: Order;

  @CreateDateColumn()
  payment_date: Date;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'varchar' })
  currency: string;
}
