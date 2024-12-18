import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentCreateDto } from './dtos/payment.create.dto';
import { PaymentSearchDto } from './dtos/payment.search.dto';
import { PaginatedResult } from 'src/common/paginated-result';
import { Order } from 'src/order/order.entity';
import { OrderStatus } from 'src/common/decorator/order_status';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  // ! Find by id
  async findOne(id: string): Promise<Payment> {
    return this.paymentRepo.findOneBy({ id });
  }

  // ! Search with params
  async search(
    params: PaymentSearchDto,
    includeUser?: boolean,
  ): Promise<PaginatedResult<Payment>> {
    const query = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoin('order.user', 'user');
    if (params.order_id) {
      query.andWhere('order.id = :order_id', {
        order_id: params.order_id,
      });
    }

    if (includeUser) {
      query.addSelect(['user']);
    }

    if (params.user_id) {
      query.andWhere('user.id = :user_id', { user_id: params.user_id });
    }

    if (params.payment_date) {
      const startDate = new Date(params.payment_date);
      const endDate = new Date(startDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      query.andWhere('payment.payment_date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    }

    // Pagination logic
    const page = params.page;
    const limit = params.limit;
    const offset = (page - 1) * limit;

    query.skip(offset).take(limit);

    const [result, total] = await query.getManyAndCount();

    const numberOfPages = Math.ceil(total / limit);
    const hasNext = page < numberOfPages;
    const hasPrevious = page > 1;

    return new PaginatedResult<Payment>(
      result,
      total,
      numberOfPages,
      hasNext,
      hasPrevious,
      limit,
      page,
    );
  }

  // ! Create
  async create(
    paymentCreateDto: PaymentCreateDto,
  ): Promise<Omit<Payment, 'setTimeZone'>> {
    const { order_id, amount, currency } = paymentCreateDto;

    // ? Validate order
    const order = await this.orderRepo.findOne({
      where: { id: order_id },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${order_id} not found.`);
    }

    // ? Create the payment
    const payment = this.paymentRepo.create({
      amount,
      currency,
      order,
    });

    const newPayment = await this.paymentRepo.save(payment);

    return { ...newPayment, order: order };
  }
}
