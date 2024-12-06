import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PaymentCreateDto } from './dtos/payment.create.dto';
import { PaymentSearchDto } from './dtos/payment.search.dto';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('')
  async create(@Body() data: PaymentCreateDto) {
    return this.paymentService.create(data);
  }

  @Get('')
  async search(
    @Query('amount') amount?: number,
    @Query('currency') currency?: string,
    @Query('payment_date') payment_date?: string,
    @Query('order_id') order_id?: string,
    @Query('user_id') user_id?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = PAGINATION_LIMIT,
  ) {
    const searchDto: PaymentSearchDto = {
      amount,
      currency,
      payment_date,
      order_id,
      user_id,
      page: page || 1,
      limit: limit || PAGINATION_LIMIT,
    };
    return this.paymentService.search(searchDto, true);
  }

  @Get(':id')
  async getById(@Param() id: string) {
    return this.paymentService.findOne(id);
  }
}
