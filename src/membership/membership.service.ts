import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Membership } from './membership.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MembershipCreateDto } from './dtos/membership.create.dto';
import { MembershipSearchDto } from './dtos/membership.search.dtp';
import { PaginatedResult } from 'src/common/paginated-result';

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    private readonly dataSource: DataSource,
  ) {}

  // ! Find by id
  async findOne(id: string): Promise<Membership> {
    return this.membershipRepo.findOneBy({ id });
  }

  // ! Search with params
  async search(
    params: MembershipSearchDto,
  ): Promise<PaginatedResult<Membership>> {
    const query = this.membershipRepo.createQueryBuilder('membership');
    if (params.deduct_rate) {
      query.andWhere('membership.deduct_rate = :deduct_rate', {
        deduct_rate: params.deduct_rate,
      });
    }

    if (params.deduct_limit) {
      query.andWhere('membership.deduct_limit = :deduct_limit', {
        deduct_limit: params.deduct_limit,
      });
    }

    // Pagination logic
    const page = params.page;
    const limit = params.limit;
    const offset = (page - 1) * limit;

    query.skip(offset).take(limit);

    const [result, total] = await query.getManyAndCount();

    const numberOfPages = Math.ceil(total / limit);
    const hasNext = page < numberOfPages;
    const hasPrevious = page > 1;

    return new PaginatedResult<Membership>(
      result,
      total,
      numberOfPages,
      hasNext,
      hasPrevious,
      limit,
      page,
    );
  }

  // ! Create multiples
  async create(data: MembershipCreateDto[]): Promise<Membership[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newMembership = queryRunner.manager.create(Membership, data);

      const membershipPromises = newMembership.map(async (membership) => {
        const lowercasedName = membership.name.toLowerCase();
        let existingAddress = await this.membershipRepo.findOne({
          where: {
            name: lowercasedName,
          },
        });

        if (existingAddress) {
          throw new BadRequestException(
            `membership name "${lowercasedName}" already exists`,
          );
        }

        membership.name = lowercasedName;
      });

      await Promise.all(membershipPromises);

      await queryRunner.manager.save(Membership, newMembership);

      await queryRunner.commitTransaction();

      return newMembership;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }
}
