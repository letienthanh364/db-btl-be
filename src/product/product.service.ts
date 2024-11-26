import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Product } from './product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductCreateDto } from './dtos/product.create.dto';
import { ProductSearchDto } from './dtos/product.search.dto';
import { PaginatedResult } from 'src/common/paginated-result';
import { isUUID } from 'class-validator';
import { ProductCategory } from 'src/product-category/product-category.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepo: Repository<ProductCategory>,
    private readonly dataSource: DataSource,
  ) {}

  // ! Find by id
  async findOne(id: string): Promise<Product> {
    return this.productRepo.findOneBy({ id });
  }

  // ! Search with params
  async search(params: ProductSearchDto): Promise<PaginatedResult<Product>> {
    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.category', 'category')
      .addSelect(['category.id', 'category.description', 'category.name']);
    if (params.name) {
      query.andWhere('product.name = :name', {
        name: params.name,
      });
    }

    if (params.price) {
      query.andWhere('product.price = :price', {
        price: params.price,
      });
    }

    if (params.reorder_point) {
      query.andWhere('product.reorder_point = :reorder_point', {
        reorder_point: params.reorder_point,
      });
    }

    if (params.description) {
      query.andWhere('product.description = :description', {
        description: params.description,
      });
    }

    if (params.category) {
      query.andWhere('category.name = :categoryName', {
        categoryName: params.category,
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

    return new PaginatedResult<Product>(
      result,
      total,
      numberOfPages,
      hasNext,
      hasPrevious,
      limit,
      page,
    );
  }

  async checkParitalProduct(product: Product & ProductCreateDto) {
    const category = await this.categoryRepo.findOneBy({
      id: product.category_id,
    });
    if (!category) {
      throw new NotFoundException(
        `category with id "${product.category_id} not found"`,
      );
    }

    product.category = category;
  }

  // ! Create multiples
  async create(data: ProductCreateDto[]): Promise<Product[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newProducts = this.productRepo.create(data);

      const productPromises = newProducts.map(async (product, index) => {
        const category = await this.categoryRepo.findOneBy({
          id: data[index].category_id,
        });

        product.category = category;
      });

      await Promise.all(productPromises);

      await queryRunner.manager.save(Product, newProducts);

      await queryRunner.commitTransaction();

      return newProducts;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }
}
