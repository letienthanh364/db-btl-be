import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { DataSource, Repository } from 'typeorm';
import { UserLoginDto } from './dtos/user.login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from 'src/common/jwt/payload';
import { UserCreateDto } from './dtos/user.create.dto';
import 'dotenv/config';
import { UserRole } from 'src/common/decorator/user_role';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async findOne(id: string): Promise<User> {
    return this.userRepo.findOneBy({ id });
  }

  async register(user: UserCreateDto): Promise<User> {
    const existingUser = await this.userRepo.findOne({
      where: {
        email: user.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('email is already used');
    }

    user.password = await bcrypt.hash(user.password, 10);

    return this.userRepo.save(user);
  }

  // ! Create multiple accounts
  async createMultipleUsers(users: UserCreateDto[]): Promise<User[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newUsers = queryRunner.manager.create(User, users);

      const userPromises = newUsers.map(async (user) => {
        let existingUser = await this.userRepo.findOne({
          where: {
            email: user.email,
          },
        });

        if (existingUser) {
          throw new BadRequestException('User already exists');
        }

        user.password = await bcrypt.hash(user.password, 10);
        user.authority_group = UserRole.Employee;
      });

      await Promise.all(userPromises);

      await queryRunner.manager.save(User, newUsers);

      await queryRunner.commitTransaction();

      return newUsers;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }

  // ! Login
  async login(userData: UserLoginDto): Promise<string> {
    const user = await this.userRepo.findOne({
      where: {
        email: userData.email,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      userData.password,
      user.password,
    );

    const payload: JwtPayload = {
      id: user.id,
    };

    if (isPasswordValid) {
      return this.jwtService.sign(payload);
    }

    throw new UnauthorizedException('login information incorrect');
  }
}
