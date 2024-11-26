import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderProduct } from './order.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Product } from 'src/product/product.entity';
import { Cart, CartProduct } from 'src/cart/cart.entity';
import { User } from 'src/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderProduct,
      Cart,
      CartProduct,
      User,
      Product,
    ]),
  ],
  exports: [TypeOrmModule.forFeature([Order, OrderProduct])],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
