import { Injectable } from '@nestjs/common';
import {
  Between,
  DataSource,
  FindManyOptions,
  Like,
  Repository,
} from 'typeorm';
import { Product } from './product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductCategory } from 'src/product-category/product-category.entity';
import { ProductSearchDto } from './dtos/product.search.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepo: Repository<ProductCategory>,
    private readonly dataSource: DataSource,
  ) {}

  // ! Find by id
  async findOne(id: string): Promise<Product> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category') // Include the category relation
      .where('product.id = :id', { id })
      .getOne();
  }

  // ! Search with params
  async searchProducts(
    dto: ProductSearchDto,
  ): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    const {
      keyword,
      category,
      priceMin,
      priceMax,
      size,
      color,
      page = 1,
      limit = 10,
    } = dto;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category'); // Join category if needed

    // Apply filters
    if (keyword) {
      query.andWhere(
        '(LOWER(product.name) LIKE LOWER(:keyword) OR LOWER(product.description) LIKE LOWER(:keyword) OR LOWER(category.name) LIKE LOWER(:keyword))',
        { keyword: `%${keyword.toLowerCase()}%` },
      );
    }

    if (category) {
      query.andWhere('category.name = :category', { category });
      console.log(category);
    }

    if (!Number.isNaN(priceMin) && !Number.isNaN(priceMax)) {
      query.andWhere('product.price BETWEEN :priceMin AND :priceMax', {
        priceMin,
        priceMax,
      });
    }

    if (size) {
      query.andWhere('product.size = :size', { size });
    }

    if (color) {
      query.andWhere('product.color = :color', { color });
    }

    // Pagination logic
    const offset = (page - 1) * limit;

    // Count total results before applying pagination
    const total = await query.getCount();

    // Apply pagination
    const products = await query.skip(offset).take(limit).getMany();

    return {
      data: products,
      total,
      page,
      limit,
    };
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { category: { id: category } },
    });
  }
}
