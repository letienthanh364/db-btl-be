import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderCreateDto } from './dtos/order.create.dto';
import { OrderSearchDto } from './dtos/order.search.dto';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';
import { OrderStatus } from 'src/common/decorator/order_status';
import { Roles, UserRole } from 'src/common/decorator/user_role';
import { JwtAuthGuard } from 'src/common/auth/strategy';
import { RolesGuard } from 'src/common/auth/role_guard';
import { RequestUser } from 'src/user/user.controller';

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
    return this.orderService.search(searchDto, true);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  // Endpoint to update order status
  @Put(':id')
  @Roles(UserRole.Employee, UserRole.Manager, UserRole.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard) // Ensuring that the request is authenticated and authorized
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string, // Ensure the id is a valid UUID
    @Body('status') status: OrderStatus, // The new status to update
    @Req() req: RequestUser, // Get the current user from the request
  ) {
    if (req.user?.authority_group === UserRole.Customer) {
      throw new ForbiddenException(
        'Only users with proper authority can update order status',
      );
    }

    // Proceed with updating the status
    return this.orderService.updateStatus(id, status);
  }
}
