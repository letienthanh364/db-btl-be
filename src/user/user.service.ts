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
import { UserCreateDto, UserRegisterDto } from './dtos/user.create.dto';
import 'dotenv/config';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async findOne(id: string): Promise<User> {
    return this.userRepo.findOne({
      where: { id },
      relations: ['addresses'], // Adjusted to include 'addresses' relation
    });
  }

  async register(user: UserRegisterDto): Promise<Partial<User>> {
    // Check for existing user
    const existingUser = await this.userRepo.findOne({
      where: { email: user.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    // Hash the password
    user.password = await bcrypt.hash(user.password, 10);

    // Create and save user
    const newUser = this.userRepo.create({
      ...user,
      registrationDate: new Date(),
    });

    const savedUser = await this.userRepo.save(newUser);

    // Return the user without password
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async login(userData: UserLoginDto): Promise<string> {
    // Find the user by email
    const user = await this.userRepo.findOne({
      where: { email: userData.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(
      userData.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Login information is incorrect');
    }

    // Generate JWT token
    const payload: JwtPayload = { id: user.id };
    return this.jwtService.sign(payload);
  }
}
