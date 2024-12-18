import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderProduct } from './order.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Product } from 'src/product/product.entity';
import { User } from 'src/user/user.entity';
import { QueueModule } from 'src/queue/queue.module'; // Import QueueModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderProduct, User, Product]),
    QueueModule, // Ensure QueueModule is imported here
  ],
  providers: [OrderService], // No need to add QueueService here
  controllers: [OrderController],
  exports: [TypeOrmModule.forFeature([Order, OrderProduct])],
})
export class OrderModule {}
