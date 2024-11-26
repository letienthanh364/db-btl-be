import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderProduct } from './order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderCreateDto } from './dtos/order.create.dto';
import { OrderSearchDto } from './dtos/order.search.dto';
import { PaginatedResult } from 'src/common/paginated-result';
import { Product } from 'src/product/product.entity';
import { Cart, CartProduct } from 'src/cart/cart.entity';
import { User } from 'src/user/user.entity';
import { OrderStatus } from 'src/common/decorator/order_status';

export const ORDER_TAX = 0.05;

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(OrderProduct)
    private readonly orderProductRepo: Repository<OrderProduct>,

    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,

    @InjectRepository(CartProduct)
    private readonly cartProductRepo: Repository<CartProduct>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  // ! Find by id
  async findOne(id: string): Promise<Order> {
    return this.orderRepo.findOneBy({ id });
  }

  // ! Search with params
  async search(params: OrderSearchDto): Promise<PaginatedResult<Order>> {
    const query = this.orderRepo
      .createQueryBuilder('order')
      .leftJoin('order.user', 'user')
      .addSelect(['user.id', 'user.name'])
      .leftJoin('order.order_products', 'orderProduct')
      .leftJoin('orderProduct.product', 'product')
      .addSelect([
        'product.id',
        'product.name',
        'orderProduct.quantity',
        'orderProduct.unit_price',
      ]);

    if (params.user_id) {
      query.andWhere('user.id = :userId', {
        userId: params.user_id,
      });
    }

    if (params.order_date) {
      query.andWhere('order.order_date = :orderDate', {
        orderDate: params.order_date,
      });
    }

    if (params.status) {
      query.andWhere('order.order_status = :status', {
        status: params.status,
      });
    }

    if (params.product_id) {
      query.andWhere('product.id = :productId', {
        productId: params.product_id,
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

    return new PaginatedResult<Order>(
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
  async create(orderCreateDto: OrderCreateDto): Promise<Order> {
    const { user_id, address, order_products } = orderCreateDto;

    // ? Validate User
    const user = await this.userRepo.findOne({
      where: { id: user_id },
      relations: ['membership'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found.`);
    }

    // ? Validate and Prepare Order Products
    const products = [];
    let originalAmount = 0;

    for (const item of order_products) {
      const product = await this.productRepo.findOne({
        where: { id: item.product_id },
      });
      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.product_id} not found.`,
        );
      }

      products.push({
        product,
        quantity: item.quantity,
        unit_price: item.unit_price,
      });

      originalAmount += item.quantity * item.unit_price;
    }

    // Calculate Order Amounts
    const tax = 0.05;
    const deductRate = user.membership?.deduct_rate || 0; // Assuming the membership has a deduct_rate field
    const deductAmount = originalAmount * deductRate;
    const remainAmount = originalAmount - deductAmount;

    // Create Order
    const order = this.orderRepo.create({
      user,
      address,
      order_date: new Date(),
      original_amount: originalAmount,
      deduct_rate: deductRate,
      deduct_amount: deductAmount,
      remain_amount: remainAmount,
      tax,
      status: OrderStatus.Checking,
    });

    const savedOrder = await this.orderRepo.save(order);

    // Save Order Products
    for (const item of products) {
      const orderProduct = this.orderProductRepo.create({
        order: savedOrder,
        product: item.product,
        quantity: item.quantity,
        unit_price: item.unit_price,
      });
      await this.orderProductRepo.save(orderProduct);
    }

    // Remove Products from Cart
    for (const item of order_products) {
      const cartProduct = await this.cartProductRepo.findOne({
        where: {
          product: { id: item.product_id },
          cart: { user: { id: user_id } },
        },
        relations: ['cart'],
      });

      if (cartProduct) {
        const cart = cartProduct.cart;

        if (cartProduct.quantity > item.quantity) {
          // Update quantity in cart
          cartProduct.quantity -= item.quantity;
          await this.cartProductRepo.save(cartProduct);
        } else {
          // Remove product from cart
          await this.cartProductRepo.remove(cartProduct);
        }

        // Recalculate the cart totals
        const remainingCartProducts = await this.cartProductRepo.find({
          where: { cart: { id: cart.id } },
        });

        await this.cartRepo.save(cart);
      }
    }

    // Return the created order with limited fields

    const returnedOrder = await this.orderRepo
      .createQueryBuilder('order')
      .leftJoin('order.user', 'user')
      .leftJoin('order.order_products', 'orderProduct')
      .leftJoin('orderProduct.product', 'product')
      .select([
        'order.id',
        'order.created_at',
        'order.order_date',
        'order.address',
        'order.original_amount',
        'order.deduct_rate',
        'order.deduct_amount',
        'order.remain_amount',
        'order.tax',
        'orderProduct.quantity',
        'orderProduct.unit_price',
        'product.id',
        'product.name',
      ])
      .where('order.id = :id', { id: savedOrder.id })
      .getOne();
    return returnedOrder;
  }
}
