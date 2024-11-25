import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserCreateDto } from './dtos/user.create.dto';
import { UserLoginDto } from './dtos/user.login.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/common/auth/strategy';
import { User } from './user.entity';

export interface RequestUser extends Request {
  user: User;
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create-users')
  async create(@Body() users: UserCreateDto[]) {
    const newUsers = await this.userService.createMultipleUsers(users);
    const simpleUsers = newUsers.map((user) => {
      const { password, deleted_at, ...res } = user;
      return res;
    });
    return {
      message: 'success',
      number: simpleUsers.length,
      users: simpleUsers,
    };
  }

  @Post('register')
  async register(@Body() user: UserCreateDto) {
    const newUser = await this.userService.register(user);
    const { password, ...res } = newUser;
    return res;
  }

  @Post('login')
  async login(@Body() user: UserLoginDto) {
    return this.userService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<User> {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCurrentUser(@Req() req: RequestUser): Promise<Partial<User>> {
    const userId = req.user.id;
    const user = await this.userService.findOne(userId);

    // Exclude sensitive fields like password and deleted_at
    const { password, deleted_at, ...userDetails } = user;
    return userDetails;
  }
}
