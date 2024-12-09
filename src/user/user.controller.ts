import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserCreateDto, UserRegisterDto } from './dtos/user.create.dto';
import { UserLoginDto } from './dtos/user.login.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/common/auth/strategy';
import { User } from './user.entity';
import { UserUpdateDto } from './dtos/user.update.dto';
import { CartService } from 'src/cart/cart.service';
import { OrderService } from 'src/order/order.service';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';
import { OrderSearchDto } from 'src/order/dtos/order.search.dto';
import { PaymentService } from 'src/payment/payment.service';
import { PaymentSearchDto } from 'src/payment/dtos/payment.search.dto';
import { OrderStatus } from 'src/common/decorator/order_status';

export interface RequestUser extends Request {
  user: User;
}

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post('employee')
  async create(@Body() users: UserCreateDto[]) {
    const newUsers = await this.userService.createEmployees(users);
    const simpleUsers = newUsers.map((user) => {
      const { password, deleted_at, ...res } = user;
      return res;
    });
    return {
      message: 'success',
      number: simpleUsers.length,
      users: simpleUsers,
    };
  }

  @Post('register')
  async register(@Body() user: UserRegisterDto) {
    const newUser = await this.userService.register(user);
    const { password, ...res } = newUser;
    return res;
  }

  @Post('login')
  async login(@Body() user: UserLoginDto) {
    return this.userService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCurrentUser(@Req() req: RequestUser): Promise<Partial<User>> {
    const userId = req.user.id;
    const user = await this.userService.findOne(userId);

    // Exclude sensitive fields like password and deleted_at
    const { password, deleted_at, ...userDetails } = user;
    return userDetails;
  }

  // @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() userData: UserUpdateDto,
  ): Promise<Partial<User>> {
    const user = await this.userService.update({
      ...userData,
      id: userId,
    });

    // Exclude sensitive fields like password and deleted_at
    const { password, deleted_at, ...userResponse } = user;
    return userResponse;
  }

  @UseGuards(JwtAuthGuard)
  @Get('order')
  async getOrderList(
    @Req() req: RequestUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = PAGINATION_LIMIT,
    @Query('status') status?: string, // Optional status query parameter
    @Query('start_date') start_date?: string, // Optional start date
    @Query('end_date') end_date?: string, // Optional end date
  ) {
    const user_id = req.user.id;
    // Create the search DTO with the necessary filters
    const searchDto: OrderSearchDto = {
      user_id,
      status: status as OrderStatus, // Ensure it's a valid enum if necessary
      start_date: start_date,
      end_date: end_date,
      page: page ? page : 1,
      limit: limit ? limit : 12,
    };

    // Call the service method to get the orders
    const orders =
      await this.orderService.getOrdersByStatusAndDateForUser(searchDto);

    // Return the paginated order list
    return orders;
  }

  @UseGuards(JwtAuthGuard)
  @Get('payment')
  async getPaymentHistory(
    @Req() req: RequestUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = PAGINATION_LIMIT,
  ) {
    const user_id = req.user.id;
    const searchDto: PaymentSearchDto = {
      user_id,
      page: page || 1,
      limit: limit || PAGINATION_LIMIT,
    };
    const orders = await this.paymentService.search(searchDto);

    return orders;
  }

  @UseGuards(JwtAuthGuard)
  @Post('cart')
  async addToCart(
    @Body() body: { product_id: string; quantity: number },
    @Req() req: RequestUser,
  ) {
    const { product_id, quantity } = body;
    const user_id = req.user.id;

    const updatedCart = await this.cartService.createOrUpdateCartProduct({
      user_id,
      product_id,
      newQuantity: quantity,
    });

    return updatedCart;
  }

  @UseGuards(JwtAuthGuard)
  @Get('cart')
  async getCart(@Req() req: RequestUser) {
    const user_id = req.user.id;
    const cartProducts = await this.cartService.getCartProducts(user_id);

    return cartProducts;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cart/:productId')
  async removeCartProduct(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Req() req: RequestUser,
  ) {
    const user_id = req.user.id;

    const updatedCart = await this.cartService.deleteCartProduct({
      userId: user_id,
      productId,
    });

    return updatedCart;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<User> {
    return this.userService.findOne(id);
  }
}
