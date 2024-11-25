import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressCreateDto } from './dtos/address.create.dto';
import { AddressSearchDto } from './dtos/address.search.dto';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post('')
  async create(@Body() data: AddressCreateDto[]) {
    return this.addressService.create(data);
  }

  @Get('')
  async search(
    @Query('default_flag') default_flag?: string,
    @Query('city') city?: string,
    @Query('district') district?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = PAGINATION_LIMIT,
  ) {
    const searchDto: AddressSearchDto = {
      default_flag,
      city,
      district,
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
