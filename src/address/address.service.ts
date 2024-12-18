import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Address } from './address.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AddressCreateDto } from './dtos/address.create.dto';
import { AddressSearchDto } from './dtos/address.search.dto';
import { PaginatedResult } from 'src/common/paginated-result';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
    private readonly dataSource: DataSource,
  ) {}

  // ! Find by id
  async findOne(id: string): Promise<Address> {
    return this.addressRepo.findOneBy({ id });
  }

  // ! Search with params
  async search(params: AddressSearchDto): Promise<PaginatedResult<Address>> {
    const query = this.addressRepo.createQueryBuilder('address');
    if (params.default_flag) {
      query.andWhere('address.default_flag = :default_flag', {
        default_flag: params.default_flag,
      });
    }

    if (params.province) {
      query.andWhere('address.province = :province', {
        province: params.province,
      });
    }

    if (params.district) {
      query.andWhere('address.district = :district', {
        district: params.district,
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

    return new PaginatedResult<Address>(
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
  async create(addresss: AddressCreateDto[]): Promise<Address[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newAddresss = queryRunner.manager.create(Address, addresss);

      const addressPromises = newAddresss.map(async (address) => {
        let existingAddress = await this.addressRepo.findOne({
          where: {
            default_flag: address.default_flag,
            province: address.province,
            district: address.district,
          },
        });

        if (existingAddress) {
          throw new BadRequestException('address already exists');
        }
      });

      await Promise.all(addressPromises);

      await queryRunner.manager.save(Address, newAddresss);

      await queryRunner.commitTransaction();

      return newAddresss;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }
}
