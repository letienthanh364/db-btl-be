import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './address.entity';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';
import { UserModule } from 'src/user/user.module'; // Import UserModule here

@Module({
  imports: [
    TypeOrmModule.forFeature([Address]),
    forwardRef(() => UserModule), // Use forwardRef() to break circular dependency
  ],
  exports: [TypeOrmModule.forFeature([Address])],
  providers: [AddressService],
  controllers: [AddressController],
})
export class AddressModule {}
