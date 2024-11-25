import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalStrategy } from '../common/auth/strategy';
import { Address } from './address.entity';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Address])],
  exports: [TypeOrmModule.forFeature([Address])],
  providers: [AddressService],
  controllers: [AddressController],
})
export class AddressModule {}
