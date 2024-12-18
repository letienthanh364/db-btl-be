import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderProduct } from './order.entity';
import { User } from 'src/user/user.entity';
import { Product } from 'src/product/product.entity';
import { OrderCreateDto } from './dtos/order.create.dto';
import { QueueService } from 'src/queue/queue.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderProduct)
    private readonly orderProductRepository: Repository<OrderProduct>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly queueService: QueueService,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createOrderAndProcessPayment(
    orderCreateDto: OrderCreateDto,
  ): Promise<Order> {
    const { user_id, orderProducts, ...orderData } = orderCreateDto;

    // Find user
    const user = await this.userRepository.findOneOrFail({
      where: { id: user_id },
    });

    // Create the order
    const order = this.orderRepository.create({
      ...orderData,
      user,
      order_date: new Date(),
    });

    const savedOrder = await this.orderRepository.save(order);

    // Process Order Products
    const orderProductEntities = await Promise.all(
      orderProducts.map(async (op) => {
        const product = await this.productRepository.findOneOrFail({
          where: { id: op.productId },
        });

        const orderProduct = this.orderProductRepository.create({
          order: savedOrder,
          product,
          quantity: op.quantity,
          unitPrice: op.unitPrice,
        });
        return orderProduct;
      }),
    );

    await this.orderProductRepository.save(orderProductEntities);

    console.log(`Payment processed for Order ID: ${savedOrder.id}`);

    return savedOrder;
  }

  async sendOrderConfirmationEmail(orderID: string, customerEmail: string) {
    await this.queueService.addEmailJob(orderID, customerEmail);
    console.log(
      `Order confirmation email job added to queue for Order ID: ${orderID}`,
    );
  }
}
