import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from '../common/auth/strategy';
import { Membership } from 'src/membership/membership.entity';
import { CartModule } from 'src/cart/cart.module';
import { CartService } from 'src/cart/cart.service';
import { OrderService } from 'src/order/order.service';
import { OrderModule } from 'src/order/order.module';
import { PaymentModule } from 'src/payment/payment.module';
import { PaymentService } from 'src/payment/payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Membership]),
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '1y' },
    }),
    CartModule,
    OrderModule,
    PaymentModule,
  ],
  exports: [TypeOrmModule.forFeature([User])],
  providers: [
    UserService,
    LocalStrategy,
    CartService,
    OrderService,
    PaymentService,
  ],
  controllers: [UserController],
})
export class UserModule {}
