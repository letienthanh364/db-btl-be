import { IsOptional } from 'class-validator';
import { BaseEntity } from 'src/common/base_entity';
import { OrderStatus } from 'src/common/decorator/order_status';
import { Product } from 'src/product/product.entity';
import { User } from 'src/user/user.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';

import * as moment from 'moment-timezone'; // Ensure you're using moment-timezone

@Entity('Order')
export class Order extends BaseEntity {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @CreateDateColumn()
  order_date: Date;

  @Column({ type: 'varchar' })
  address: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.AwaitPayment,
  })
  @IsOptional()
  status: OrderStatus;

  @Column({ type: 'float' })
  original_amount: number;

  @Column({ type: 'float' })
  deduct_rate: number;

  @Column({ type: 'float' })
  deduct_amount: number;

  @Column({ type: 'float' })
  remain_amount: number;

  @Column({ type: 'float' })
  tax: number;

  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.order)
  order_products: OrderProduct[];

  @BeforeInsert()
  @BeforeUpdate()
  setTimeZone() {
    // Ensure that we are always assigning a Date object.
    const hoChiMinhTime = moment.tz('Asia/Ho_Chi_Minh').toDate(); // Use toDate() to get a Date object

    // Assign the created_at and updated_at properties with Date objects
    this.created_at = this.created_at
      ? moment(this.created_at).tz('Asia/Ho_Chi_Minh').toDate()
      : hoChiMinhTime;
    this.updated_at = this.updated_at
      ? moment(this.updated_at).tz('Asia/Ho_Chi_Minh').toDate()
      : hoChiMinhTime;
    this.order_date = this.order_date
      ? moment(this.order_date).tz('Asia/Ho_Chi_Minh').toDate()
      : hoChiMinhTime;
  }
}

@Entity('OrderProduct')
export class OrderProduct extends BaseEntity {
  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'float' })
  unit_price: number;
}
