import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Cart, CartProduct } from './cart.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CartCreateDto } from './dtos/cart.create.dto';
import { CartSearchDto } from './dtos/cart.search.dto';
import { PaginatedResult } from 'src/common/paginated-result';
import { Product } from 'src/product/product.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,

    @InjectRepository(CartProduct)
    private readonly cartProductRepo: Repository<CartProduct>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  // ! Find by id
  async findOne(id: string): Promise<Cart> {
    return this.cartRepo.findOneBy({ id });
  }

  // ! Search with params
  async search(params: CartSearchDto): Promise<PaginatedResult<Cart>> {
    const query = this.cartRepo
      .createQueryBuilder('cart')
      .leftJoin('cart.user', 'user')
      .addSelect(['user.id', 'user.name'])
      .leftJoin('cart.cart_products', 'cartProduct')
      .leftJoin('cartProduct.product', 'product')
      .addSelect(['product.id', 'product.name', 'cartProduct.quantity']);

    if (params.user_id) {
      query.andWhere('user.id = :userId', {
        userId: params.user_id,
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

    return new PaginatedResult<Cart>(
      result,
      total,
      numberOfPages,
      hasNext,
      hasPrevious,
      limit,
      page,
    );
  }

  // ! Create
  async create(cartCreateDto: CartCreateDto): Promise<Cart> {
    const { user_id, cart_products } = cartCreateDto;

    // Find if the user already has a cart
    let cart = await this.cartRepo.findOne({
      where: { user: { id: user_id } },
      relations: ['cart_products', 'cart_products.product'],
    });

    if (!cart) {
      // Create a new cart if none exists
      cart = this.cartRepo.create({ user: { id: user_id }, cart_products: [] });
      cart = await this.cartRepo.save(cart);
    }

    for (const cartProductDto of cart_products) {
      const { product_id, quantity } = cartProductDto;

      // Validate the product exists
      const product = await this.productRepo.findOne({
        where: { id: product_id },
      });
      if (!product) {
        throw new NotFoundException(`Product with id ${product_id} not found`);
      }

      if (quantity === 0) {
        throw new BadRequestException(
          `Invalid quantity for product "${product.name}"`,
        );
      }

      // Check if the product already exists in the cart
      let cartProduct = cart.cart_products.find(
        (cp) => cp.product.id === product_id,
      );

      if (cartProduct) {
        // Update the quantity if the product exists
        cartProduct.quantity += Number(quantity);
      } else {
        // Add the product to the cart if it doesn't exist
        cartProduct = this.cartProductRepo.create({
          cart,
          product,
          quantity,
        });
        cart.cart_products.push(cartProduct);
      }

      // Save the cartProduct
      await this.cartProductRepo.save(cartProduct);
    }

    // Return the updated cart
    return this.cartRepo
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.cart_products', 'cartProduct')
      .leftJoinAndSelect('cartProduct.product', 'product')
      .select([
        'cart',
        'product.id', // Select product ID
        'product.name', // Select product name
        'cartProduct.quantity', // Select cartProduct quantity
      ])
      .where('cart.id = :cartId', { cartId: cart.id })
      .getOne();
  }
}
