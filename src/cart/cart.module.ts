import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart, CartProduct } from './cart.entity';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Product } from 'src/product/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartProduct, Product])],
  exports: [TypeOrmModule.forFeature([Cart, CartProduct])],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule {}
