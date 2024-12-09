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
    return this.productRepo.findOneBy({ id });
  }

  // ! Search with params
  async search(params: ProductSearchDto): Promise<PaginatedResult<Product>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // If 'sort' is 'top seller', call the procedure to get top-selling products
      let result = [];
      let total = 0;

      if (params.sort === 'top seller') {
        // Ensure that min_quantity is set, for example, 10 (you can adjust this or pass as a param)
        const minQuantity = params.minQuantity || 50;

        // Call the procedure to get the top-selling products based on sales quantity
        await queryRunner.manager.query(
          `CALL public.get_products_satisfying_sales_count($1)`,
          [minQuantity],
        );

        // Get the top-selling products from the temp table
        result = await queryRunner.manager.query(
          `
            SELECT p.* FROM public."Product" p
            INNER JOIN temp_product_sales ps ON ps.product_id = p.id
            ORDER BY ps.total_quantity_sold DESC
          `,
        );

        total = result.length; // The total count will be the number of products returned from the temp table
      } else {
        // Normal product search logic when sort is not 'top seller'
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

        // Apply sorting (default to 'created_at' descending)
        if (params.sort === 'top seller') {
          // Sorting is already done in the procedure (based on quantity sold)
          // So no additional sorting needed here
        } else if (params.sort === 'price') {
          query.orderBy('product.price', 'ASC');
        } else if (params.sort === 'reorder_point') {
          query.orderBy('product.reorder_point', 'ASC');
        } else {
          query.orderBy('product.created_at', 'DESC');
        }

        query.skip(offset).take(limit);

        // Execute the query to get paginated products
        [result, total] = await query.getManyAndCount();
      }

      // Pagination logic
      const numberOfPages = Math.ceil(total / (params.limit || 10));
      const hasNext = params.page < numberOfPages;
      const hasPrevious = params.page > 1;

      return new PaginatedResult<Product>(
        result,
        total,
        numberOfPages,
        hasNext,
        hasPrevious,
        params.limit || 10,
        params.page || 1,
      );
    } catch (error) {
      // Handle any errors
      throw new Error(`Error fetching products: ${error.message}`);
    } finally {
      // Commit the transaction and release the query runner
      await queryRunner.commitTransaction();
      await queryRunner.release();
    }
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
