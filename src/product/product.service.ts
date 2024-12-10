import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
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
    return this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category') // Include the category relation
      .where('product.id = :id', { id })
      .getOne();
  }

  // ! Search with params
  async search(params: ProductSearchDto): Promise<PaginatedResult<Product>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let productIds = [];
      let total = 0;

      if (params.sort === 'top seller') {
        // Execute procedure to populate temp table
        const minQuantity = params.minQuantity || 50;
        await queryRunner.manager.query(
          `CALL public.get_products_satisfying_sales_count($1)`,
          [minQuantity],
        );

        // Retrieve product IDs from the temp table
        const tempResult = await queryRunner.manager.query(
          `
          SELECT ps.product_id
          FROM temp_product_sales ps
          ORDER BY ps.total_quantity_sold DESC
          `,
        );

        productIds = tempResult.map((row) => row.product_id);
        total = productIds.length;
      } else {
        // If no params.sort, fetch all product IDs
        const allProductsResult = await this.productRepo
          .createQueryBuilder('product')
          .select('product.id')
          .getMany();

        productIds = allProductsResult.map((product) => product.id);
        total = productIds.length;
      }

      // Fetch products and apply additional filters
      const [result, totalCount] = await this.getFilteredProducts(
        params,
        productIds,
        total,
      );

      // Return the paginated result
      const numberOfPages = Math.ceil(totalCount / (params.limit || 10));
      const hasNext = params.page < numberOfPages;
      const hasPrevious = params.page > 1;

      return new PaginatedResult<Product>(
        result,
        totalCount,
        numberOfPages,
        hasNext,
        hasPrevious,
        params.limit || 10,
        params.page || 1,
      );
    } catch (error) {
      throw new Error(`Error fetching products: ${error.message}`);
    } finally {
      await queryRunner.commitTransaction();
      await queryRunner.release();
    }
  }

  private async getFilteredProducts(
    params: ProductSearchDto,
    productIds: string[],
    tempTotal: number,
  ): Promise<[Product[], number]> {
    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    // Apply filters
    if (params.name) {
      query.andWhere('product.name = :name', { name: params.name });
    }

    if (params.price) {
      query.andWhere('product.price = :price', { price: params.price });
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
        { keyword: `%${params.keyword.toLowerCase()}%` },
      );
    }

    // Handle productIds filter
    if (params.sort === 'top seller' && productIds.length) {
      query.andWhere('product.id IN (:...productIds)', { productIds });
    }

    // Pagination logic
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    // Apply sorting
    if (params.sort === 'price') {
      query.orderBy('product.price', 'ASC');
    } else if (params.sort === 'reorder_point') {
      query.orderBy('product.reorder_point', 'ASC');
    } else {
      query.orderBy('product.created_at', 'DESC');
    }

    query.skip(offset).take(limit);

    // Fetch results and count
    if (params.sort === 'top seller') {
      return [await query.getMany(), tempTotal];
    }

    return query.getManyAndCount();
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
      // Map through all the product create data and call the procedure for each product
      const productPromises = data.map(async (productDto) => {
        const {
          category_id,
          name,
          description,
          price,
          inventory_quantity,
          reorder_point,
        } = productDto;

        // Call the stored procedure to insert the product
        await queryRunner.manager.query(
          `CALL public.insert_product($1, $2, $3, $4, $5, $6)`,
          [
            name,
            description,
            price,
            inventory_quantity,
            reorder_point,
            category_id,
          ],
        );
      });

      // Wait for all product insertions to complete
      await Promise.all(productPromises);

      // Query the newly inserted products based on their names (or other unique attributes)
      const newProducts = await queryRunner.manager.find(Product, {
        where: data.map((productDto) => ({
          name: productDto.name,
          price: productDto.price, // Match exact price as well
        })),
      });

      await queryRunner.commitTransaction();

      return newProducts; // Return the newly created products
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
    const queryRunner = this.dataSource.createQueryRunner();

    // Start a transaction to ensure atomicity
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Call the update_product procedure to update the product
      await queryRunner.manager.query(
        'CALL public.update_product($1, $2, $3, $4, $5, $6, $7)',
        [
          id,
          productData.name,
          productData.description,
          productData.price,
          productData.inventory_quantity,
          productData.reorder_point,
          productData.category_id,
        ],
      );

      // Fetch the updated product from the database
      const updatedProduct = await queryRunner.manager.findOne(Product, {
        where: { id },
      });

      if (!updatedProduct) {
        throw new InternalServerErrorException(
          `Updated product with ID "${id}" not found.`,
        );
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      return updatedProduct;
    } catch (error) {
      // Rollback in case of error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  // ! Delete
  async delete(id: string): Promise<string> {
    const queryRunner = this.dataSource.createQueryRunner();

    // Start a transaction to ensure atomicity
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Call the delete_product procedure
      await queryRunner.manager.query('CALL public.delete_product($1)', [id]);

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Return success message
      return `Product with ID "${id}" deleted successfully!`;
    } catch (error) {
      // Rollback in case of error
      await queryRunner.rollbackTransaction();

      // Handle specific error codes and raise appropriate exceptions
      if (error.code === '23503') {
        if (error.detail?.includes('OrderProduct')) {
          throw new BadRequestException(
            `Cannot delete product with ID "${id}" because it is referenced in one or more orders.`,
          );
        } else if (error.detail?.includes('CartProduct')) {
          throw new BadRequestException(
            `Cannot delete product with ID "${id}" because it is referenced in one or more carts.`,
          );
        }
      }

      // General error handling
      throw new BadRequestException(
        `Failed to delete product with ID "${id}". ${error.message}`,
      );
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }
}
