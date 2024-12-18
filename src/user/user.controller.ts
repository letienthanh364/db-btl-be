import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { UserRegisterDto } from './dtos/user.create.dto';
import { UserLoginDto } from './dtos/user.login.dto';
import { UserService } from './user.service';
import { User } from './user.entity';

export interface RequestUser extends Request {
  user: User;
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() user: UserRegisterDto) {
    const newUser = await this.userService.register(user);
    const { password, ...res } = newUser;
    return res;
  }

  @Post('login')
  async login(@Body() user: UserLoginDto) {
    return this.userService.login(user);
  }
}
