import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressCreateDto } from './dtos/address.create';
import { AddressSearchDto } from './dtos/address.search';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post('')
  async create(@Body() data: AddressCreateDto[]) {
    return this.addressService.create(data);
  }

  @Get('')
  async search(
    @Query() default_flag: string,
    @Query() city: string,
    @Query() district: string,
  ) {
    const searchDto: AddressSearchDto = {
      default_flag: default_flag,
      city: city,
      district: district,
    };
    return this.addressService.search(searchDto);
  }

  @Get(':id')
  async getById(@Param() id: string) {
    return this.addressService.findOne(id);
  }
}
