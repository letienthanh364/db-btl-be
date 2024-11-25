import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSource } from 'ormconfig';
import { UserModule } from './user/user.module';
import { AddressModule } from './address/address.module';
import { MembershipModule } from './membership/membership.module';
import { ProductCategoryModule } from './product-category/product-category.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSource.options),
    UserModule,
    AddressModule,
    MembershipModule,
    ProductCategoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
