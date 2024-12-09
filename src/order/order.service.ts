import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { Order, OrderProduct } from './order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderCreateDto } from './dtos/order.create.dto';
import { OrderSearchDto } from './dtos/order.search.dto';
import { PaginatedResult, PAGINATION_LIMIT } from 'src/common/paginated-result';
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
    return this.orderRepo
      .createQueryBuilder('order')
      .leftJoin('order.order_products', 'orderProduct')
      .leftJoin('orderProduct.product', 'product')
      .addSelect([
        'product.id',
        'product.name',
        'product.image_url',
        'product.price',
        'orderProduct.quantity',
        'orderProduct.unit_price',
      ])
      .where('order.id = :id', { id })
      .getOne();
  }

  // ! Search with params
  async search(
    params: OrderSearchDto,
    includeUser?: boolean,
  ): Promise<PaginatedResult<Order>> {
    const query = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.order_products', 'orderProduct') // Using leftJoinAndSelect to properly load related entities
      .leftJoinAndSelect('orderProduct.product', 'product') // Left join to product for product details
      .addSelect([
        'product.id',
        'product.name',
        'product.image_url',
        'product.price',
        'orderProduct.quantity',
        'orderProduct.unit_price',
      ]);

    // Always allow filtering by user_id, even if includeUser is false
    if (params.user_id) {
      query.andWhere('order.user_id = :userId', {
        userId: params.user_id,
      });
    }

    // If includeUser is true, join and select user details
    if (includeUser) {
      query
        .leftJoinAndSelect('order.user', 'user')
        .addSelect(['user.id', 'user.name']);
    }

    // if (params.order_date) {
    //   query.andWhere('order.order_date = :orderDate', {
    //     orderDate: params.order_date,
    //   });
    // }

    if (params.status) {
      query.andWhere('order.order_status = :status', {
        status: params.status,
      });
    }

    // if (params.product_id) {
    //   query.andWhere('product.id = :productId', {
    //     productId: params.product_id,
    //   });
    // }

    // Add ordering by order_date descending (latest orders first)
    query.orderBy('order.order_date', 'DESC');

    // Pagination logic
    const page = params.page || 1;
    const limit = params.limit || 100;
    const offset = (page - 1) * limit;

    query.skip(offset).take(limit);

    // Execute the query to get the results and count
    const [result, total] = await query.getManyAndCount();

    // Pagination logic
    const numberOfPages = Math.ceil(total / limit);
    const hasNext = page < numberOfPages;
    const hasPrevious = page > 1;

    // Return the paginated results, ensuring the order_products are correctly associated
    return new PaginatedResult<Order>(
      result, // The result is already mapped correctly
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
    const { user_id, address, order_products, use_discount } = orderCreateDto;

    // ? Start a transaction to ensure atomic operations
    const queryRunner = this.orderRepo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // ? Validate User
      const user = await queryRunner.manager.findOne(User, {
        where: { id: user_id },
        relations: ['membership'],
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${user_id} not found.`);
      }

      // Validate and Prepare Order Products
      const products = [];
      let originalAmount = 0;

      for (const item of order_products) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.product_id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.product_id} not found.`,
          );
        }

        // Check stock availability
        if (item.quantity > product.inventory_quantity) {
          throw new BadRequestException(
            `Product "${product.name}" has only ${product.inventory_quantity} items in stock.`,
          );
        }

        // Prepare the products array for the order
        products.push({
          product,
          quantity: item.quantity,
          unit_price: item.unit_price,
        });

        // Calculate the original amount
        originalAmount += item.quantity * item.unit_price;
      }

      // Calculate Order Amounts
      const tax = 0.05;

      let deductRate = 0;
      let deductAmount = 0;
      let remainAmount = originalAmount;

      if (use_discount) {
        // Apply discount logic if use_discount is true
        deductRate = user.membership?.deduct_rate || 0;
        deductAmount = originalAmount * deductRate;
        remainAmount = originalAmount - deductAmount;
      }

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
        status: OrderStatus.AwaitPayment,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // ? Save Order Products and Update Product Inventory
      for (const item of products) {
        const orderProduct = this.orderProductRepo.create({
          order: savedOrder,
          product: item.product,
          quantity: item.quantity,
          unit_price: item.unit_price,
        });

        // Update the product inventory quantity after creating the order product
        item.product.inventory_quantity -= item.quantity;
        await queryRunner.manager.save(Product, item.product); // Update product's inventory in DB

        await queryRunner.manager.save(orderProduct); // Save the order product
      }

      // ? Remove Products from Cart
      for (const item of order_products) {
        const cartProduct = await queryRunner.manager.findOne(CartProduct, {
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
            await queryRunner.manager.save(cartProduct);
          } else {
            // Remove product from cart
            await queryRunner.manager.remove(cartProduct);
          }

          // Recalculate the cart totals
          const remainingCartProducts = await queryRunner.manager.find(
            CartProduct,
            {
              where: { cart: { id: cart.id } },
            },
          );

          await queryRunner.manager.save(cart);
        }
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

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
          'product.image_url',
          'product.price',
        ])
        .where('order.id = :id', { id: savedOrder.id })
        .getOne();
      return returnedOrder;
    } catch (error) {
      // If any error occurs, rollback the transaction
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner after the transaction
      await queryRunner.release();
    }
  }

  // ! Update Order Status
  async updateStatus(orderId: string, newStatus: OrderStatus): Promise<Order> {
    // Step 1: Validate Order
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found.`);
    }

    // Step 2: Check if the new status is valid
    if (!Object.values(OrderStatus).includes(newStatus)) {
      throw new BadRequestException(`Invalid status: ${newStatus}`);
    }

    // Step 3: Update Order Status
    order.status = newStatus;

    // Save the updated order status
    const updatedOrder = await this.orderRepo.save(order);

    // Step 4: Return the updated order
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
        'order.status',
        'orderProduct.quantity',
        'orderProduct.unit_price',
        'product.id',
        'product.name',
        'product.image_url',
        'product.price',
      ])
      .where('order.id = :id', { id: updatedOrder.id })
      .getOne();

    return returnedOrder;
  }

  // ! Filter order by status and date
  async getOrdersByStatusAndDateForUser(
    params: OrderSearchDto,
  ): Promise<PaginatedResult<any>> {
    const {
      status,
      start_date,
      end_date,
      page = 1,
      limit = 10,
      user_id,
    } = params;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Prepare start and end date if the user provided a specific order date range
      const startDate = start_date
        ? new Date(start_date)
        : new Date('2000-01-01'); // Default to an old date if no range is provided
      const endDate = end_date ? new Date(end_date) : new Date(); // Default to today's date
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      const passedStatus = status ? status : OrderStatus.AwaitPayment;

      // Call the stored procedure using queryRunner to populate the temp table
      await queryRunner.manager.query(
        `CALL public.get_orders_by_status_and_date($1, $2, $3, $4)`,
        [user_id, passedStatus, startDate, endDate],
      );

      // Now, get the order IDs from the temp_orders table
      const orderIdsResult = await queryRunner.manager.query(
        `SELECT order_id FROM temp_orders ORDER BY order_date DESC LIMIT $1 OFFSET $2`,
        [limit, (page - 1) * limit],
      );

      const orderIds = orderIdsResult.map((row) => row.order_id);

      // Now, use TypeORM to fetch the full order details for each order_id
      const orders = await this.orderRepo.find({
        where: { id: In(orderIds) },
        relations: ['order_products', 'user', 'order_products.product'], // Fetch related order products and products
        order: { order_date: 'DESC' },
      });

      // Extract total count (we assume `temp_orders` has the same records we need to paginate)
      const totalCountResult = await queryRunner.manager.query(
        `SELECT COUNT(*) FROM temp_orders`,
      );
      const totalCount = parseInt(totalCountResult[0].count, 10);

      // Calculate number of pages
      const numberOfPages = Math.ceil(totalCount / limit);
      const hasNext = page < numberOfPages;
      const hasPrevious = page > 1;

      // Format the result into a paginated structure
      const formattedResult = orders.map((order) => {
        return {
          id: order.id,
          created_at: order.created_at,
          updated_at: order.updated_at,
          order_date: order.order_date,
          address: order.address,
          original_amount: order.original_amount,
          deduct_rate: order.deduct_rate,
          deduct_amount: order.deduct_amount,
          remain_amount: order.remain_amount,
          tax: order.tax,
          status: order.status,
          user: {
            name: order.user.name,
            email: order.user.email,
          },
          order_products: order.order_products.map((orderProduct) => ({
            id: orderProduct.product.id,
            name: orderProduct.product.name,
            image_url: orderProduct.product.image_url,
            price: orderProduct.product.price,
            quantity: orderProduct.quantity,
            unit_price: orderProduct.unit_price,
          })),
        };
      });

      // Return PaginatedResult
      return new PaginatedResult(
        formattedResult,
        totalCount,
        numberOfPages,
        hasNext,
        hasPrevious,
        limit,
        page,
      );
    } catch (error) {
      // Handle errors
      throw new Error(`Error fetching orders: ${error.message}`);
    } finally {
      // Release the query runner after operation
      await queryRunner.release();
    }
  }
}
