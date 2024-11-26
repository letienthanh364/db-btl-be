import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderCreateDto } from './dtos/order.create.dto';
import { OrderSearchDto } from './dtos/order.search.dto';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';
import { OrderStatus } from 'src/common/decorator/order_status';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('')
  async create(@Body() data: OrderCreateDto) {
    return this.orderService.create(data);
  }

  @Get('')
  async search(
    @Query('user_id') user_id?: string,
    @Query('product_id') product_id?: string,
    @Query('status') status?: OrderStatus,
    @Query('order_date') order_date?: Date,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = PAGINATION_LIMIT,
  ) {
    const searchDto: OrderSearchDto = {
      user_id,
      product_id,
      status,
      order_date,
      page: page || 1,
      limit: limit || PAGINATION_LIMIT,
    };
    return this.orderService.search(searchDto);
  }

  @Get(':id')
  async getById(@Param() id: string) {
    return this.orderService.findOne(id);
  }
}
