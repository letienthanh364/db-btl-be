import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer, Employee, User } from 'src/user/user.entity';
import { DataSource, Repository } from 'typeorm';
import { UserLoginDto } from './dtos/user.login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from 'src/common/jwt/payload';
import { UserCreateDto, UserRegisterDto } from './dtos/user.create.dto';
import 'dotenv/config';
import { UserRole } from 'src/common/decorator/user_role';
import { Membership } from 'src/membership/membership.entity';
import { UserUpdateDto } from './dtos/user.update.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async findOne(id: string): Promise<User> {
    return this.userRepo.findOne({
      where: { id },
      relations: ['membership', 'address'], // Include the membership relation
    });
  }

  async register(
    user: UserRegisterDto,
  ): Promise<Omit<Customer, 'setTimeZone'>> {
    const existingUser = await this.userRepo.findOne({
      where: {
        email: user.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('email is already used');
    }

    user.password = await bcrypt.hash(user.password, 10);

    const newUser = await this.userRepo.save(user);
    const { department, position, authority_group, ...newCustomer } = newUser;
    return newCustomer;
  }

  // ! Create multiple accounts
  async createEmployees(
    users: UserCreateDto[],
  ): Promise<Omit<Employee, 'setTimeZone'>[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newUsers = queryRunner.manager.create(User, users);

      const userPromises = newUsers.map(async (user, index) => {
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

      const newEmployees = newUsers.map((user) => {
        const { point, ...res } = user;
        return res;
      });
      return newEmployees;
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

  async update(userData: UserUpdateDto): Promise<User> {
    const { id: userId, membership_id, ...updateFields } = userData;

    // Find the user by ID
    const user = await this.userRepo.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    // Update membership if membership_id is provided
    if (membership_id) {
      const membership = await this.membershipRepo.findOneBy({
        id: membership_id,
      });

      if (!membership) {
        throw new NotFoundException(
          `Membership with id "${membership_id}" not found`,
        );
      }

      user.membership = membership;
    }

    // Update other fields
    Object.assign(user, updateFields);

    // Save the updated user
    await this.userRepo.save(user);

    return this.userRepo
      .createQueryBuilder('user')
      .leftJoin('user.membership', 'membership')
      .addSelect(['membership.name'])
      .where('user.id = :id', { id: user.id })
      .getOne();
  }
}
