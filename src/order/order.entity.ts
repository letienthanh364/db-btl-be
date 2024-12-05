import { IsOptional } from 'class-validator';
import { Address } from 'src/address/address.entity';
import { BaseEntity } from 'src/common/base_entity';
import { OrderStatus } from 'src/common/decorator/order_status';
import { Product } from 'src/product/product.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';

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
