import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CartCreateDto } from './dtos/cart.create.dto';
import { CartSearchDto } from './dtos/cart.search.dto';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('')
  async create(@Body() data: CartCreateDto) {
    return this.cartService.createOrUpdateCartProduct(data);
  }

  @Get('')
  async search(
    @Query('user_id') user_id?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = PAGINATION_LIMIT,
  ) {
    const searchDto: CartSearchDto = {
      user_id,
      page: page || 1,
      limit: limit || PAGINATION_LIMIT,
    };
    return this.cartService.search(searchDto);
  }

  @Get(':cartId/check-and-calculate-total')
  async checkCanPurchaseCartAndCalculateTotal(@Param('cartId') cartId: string) {
    try {
      const total =
        await this.cartService.checkCanPurchaseCartAndCalculateTotal(cartId);
      return { total }; // Return the total price calculated by the SQL function
    } catch (error) {
      throw new BadRequestException(error.message); // Handle any errors
    }
  }

  @Get(':cartId/calculate-payable-amount')
  async calculatePayableAmountWithOwnerShipMemberShip(
    @Param('cartId') cartId: string,
  ) {
    try {
      const total =
        await this.cartService.calculatePayableAmountWithOwnerShipMemberShip(
          cartId,
        );
      return { total }; // Return the total price calculated by the SQL function
    } catch (error) {
      throw new BadRequestException(error.message); // Handle any errors
    }
  }

  @Get(':id')
  async getById(@Param() id: string) {
    return this.cartService.findOne(id);
  }
}
