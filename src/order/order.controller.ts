import { Body, Controller, Param, Post, ParseUUIDPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderCreateDto } from './dtos/order.create.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Create a new order and process payment
   */
  @Post('')
  async createOrder(@Body() data: OrderCreateDto) {
    const order = await this.orderService.createOrderAndProcessPayment(data);

    // await this.orderService.sendOrderConfirmationEmail(
    //   order.id,
    //   data.customerEmail,
    // );

    return {
      success: true,
      order: order,
    };
  }

  @Post(':orderID/send-confirmation')
  async sendConfirmation(
    @Param('orderID', ParseUUIDPipe) orderID: string,
    @Body('email') email: string,
  ) {
    await this.orderService.sendOrderConfirmationEmail(orderID, email);

    return {
      success: true,
      message: 'Order confirmation email will be sent shortly.',
    };
  }
}
