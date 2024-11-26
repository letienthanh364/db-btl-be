import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductCategory } from './product-category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductCategoryCreateDto } from './dtos/product-category.create.dto';
import { ProductCategorySearchDto } from './dtos/product-category.search.dto';
import { PaginatedResult } from 'src/common/paginated-result';

@Injectable()
export class ProductCategoryService {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly categoryRepo: Repository<ProductCategory>,
    private readonly dataSource: DataSource,
  ) {}

  // ! Find by id
  async findOne(id: string): Promise<ProductCategory> {
    return this.categoryRepo.findOneBy({ id });
  }

  // ! Search with params
  async search(
    params: ProductCategorySearchDto,
  ): Promise<PaginatedResult<ProductCategory>> {
    const query = this.categoryRepo.createQueryBuilder('category');
    if (params.name) {
      query.andWhere('category.name = :name', {
        name: params.name,
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

    return new PaginatedResult<ProductCategory>(
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
  async create(data: ProductCategoryCreateDto[]): Promise<ProductCategory[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newCategories = queryRunner.manager.create(ProductCategory, data);

      const categoryPromises = newCategories.map(async (cate) => {
        const lowercasedName = cate.name.toLowerCase();
        let existingAddress = await this.categoryRepo.findOne({
          where: {
            name: lowercasedName,
          },
        });

        if (existingAddress) {
          throw new BadRequestException(
            `category name "${lowercasedName}" already exists`,
          );
        }

        cate.name = lowercasedName;
      });

      await Promise.all(categoryPromises);

      await queryRunner.manager.save(ProductCategory, newCategories);

      await queryRunner.commitTransaction();

      return newCategories;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }
}
