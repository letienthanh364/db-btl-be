import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipCreateDto } from './dtos/membership.create.dto';
import { MembershipSearchDto } from './dtos/membership.search.dtp';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';

@Controller('membership')
export class MembershipController {
  constructor(private readonly addressService: MembershipService) {}

  @Post('')
  async create(@Body() data: MembershipCreateDto[]) {
    return this.addressService.create(data);
  }

  @Get('')
  async search(
    @Query('deduct_rate') deduct_rate?: number,
    @Query('deduct_limit') deduct_limit?: number,
    @Query('deduct_available') deduct_available?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const searchDto: MembershipSearchDto = {
      deduct_rate,
      deduct_limit,
      deduct_available,
      page: page || 1,
      limit: limit || PAGINATION_LIMIT,
    };
    return this.addressService.search(searchDto);
  }

  @Get(':id')
  async getById(@Param() id: string) {
    return this.addressService.findOne(id);
  }
}
