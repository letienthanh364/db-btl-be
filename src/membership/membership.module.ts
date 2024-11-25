import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalStrategy } from '../common/auth/strategy';
import { Membership } from './membership.entity';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Membership])],
  exports: [TypeOrmModule.forFeature([Membership])],
  providers: [MembershipService],
  controllers: [MembershipController],
})
export class MembershipModule {}
