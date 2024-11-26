import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSource } from 'ormconfig';
import { UserModule } from './user/user.module';
import { MembershipModule } from './membership/membership.module';
import { ProductCategoryModule } from './product-category/product-category.module';
import { ProductModule } from './product/product.module';
import { AddressModule } from './address/address.module';
import { CartModule } from './cart/cart.module';
import { ReviewModule } from './review/review.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSource.options),
    UserModule,
    AddressModule,
    MembershipModule,
    ProductCategoryModule,
    ProductModule,
    CartModule,
    ReviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
