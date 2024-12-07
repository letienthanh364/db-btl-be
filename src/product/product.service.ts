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

    if (params.keyword) {
      query.andWhere(
        '(LOWER(product.name) LIKE LOWER(:keyword) OR LOWER(product.description) LIKE LOWER(:keyword) OR LOWER(category.name) LIKE LOWER(:keyword))',
        {
          keyword: `%${params.keyword.toLowerCase()}%`,
        },
      );
    }

    // Pagination logic
    const page = params.page || 1;
    const limit = params.limit || 10;
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

  // ! Update
  async update(
    id: string,
    productData: Partial<ProductCreateDto>,
  ): Promise<Product> {
    const product = await this.productRepo.findOneBy({ id });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }

    if (productData.category_id) {
      const category = await this.categoryRepo.findOneBy({
        id: productData.category_id,
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID "${productData.category_id}" not found.`,
        );
      }
      product.category = category;
    }

    Object.assign(product, productData);

    return this.productRepo.save(product);
  }

  // ! Delete
  async delete(id: string): Promise<void> {
    const product = await this.productRepo.findOneBy({ id });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }

    try {
      await this.productRepo.remove(product);
    } catch (error) {
      if (
        error.code === '23503' && // PostgreSQL foreign key violation error code
        error.detail?.includes('OrderProduct')
      ) {
        throw new BadRequestException(
          `Cannot delete product with ID "${id}" because it is referenced in one or more orders.`,
        );
      }
      throw new BadRequestException(
        `Failed to delete product with ID "${id}". ${error.message}`,
      );
    }
  }
}
