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
import { Optional } from '@nestjs/common';

@Entity('Order')
export class Order extends BaseEntity {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @CreateDateColumn()
  order_date: Date;

  @Column({ type: 'varchar' })
  customerName: string;

  @Column({ type: 'varchar' })
  customerPhone: string;

  @Column({ type: 'varchar' })
  customerEmail: string;

  @Column({ type: 'varchar' })
  province: string;

  @Column({ type: 'varchar' })
  district: string;

  @Column({ type: 'varchar' })
  commune: string;

  @Column({ type: 'varchar' })
  address: string;

  @Column({ type: 'varchar' })
  housingType: string;

  @Column({ type: 'float' })
  totalAmount: number;

  @Column({ type: 'float' })
  totalFee: number;

  @Column({ type: 'float' })
  totalDiscount: number;

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
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId', referencedColumnName: 'id' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'float' })
  unitPrice: number;
}
