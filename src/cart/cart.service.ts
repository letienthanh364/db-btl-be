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
import { CartUpdateDto } from './dtos/cart.update.dto';
import { CartDeleteProductDto } from './dtos/cart.delete.dto';

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

  // ! Create or update
  async createOrUpdateCartProduct(
    cartCreateOrUpdateDto: CartCreateDto & {
      product_id: string;
      newQuantity: number;
    },
  ): Promise<Cart> {
    const { user_id, product_id, newQuantity } = cartCreateOrUpdateDto;

    if (newQuantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    // Check if a cart exists for the user
    let cart = await this.cartRepo.findOne({
      where: { user: { id: user_id } },
      relations: ['cart_products', 'cart_products.product'],
    });

    // Validate the product
    const product = await this.productRepo.findOne({
      where: { id: product_id },
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${product_id} not found`);
    }

    // Check if the new quantity exceeds the available inventory
    if (newQuantity > product.inventory_quantity) {
      throw new BadRequestException(
        `Cannot add ${newQuantity} items to the cart. Only ${product.inventory_quantity} items are available in stock.`,
      );
    }

    if (!cart) {
      // Create a new cart if it doesn't exist
      cart = this.cartRepo.create({ user: { id: user_id }, cart_products: [] });
      cart = await this.cartRepo.save(cart);

      // Add the new cart product to the newly created cart
      const cartProduct = this.cartProductRepo.create({
        cart,
        product,
        quantity: newQuantity,
      });
      cart.cart_products.push(cartProduct);
      await this.cartProductRepo.save(cartProduct);
    } else {
      // If the cart exists, check if the product is already in the cart
      let cartProduct = cart.cart_products.find(
        (cp) => cp.product.id === product_id,
      );

      if (cartProduct) {
        // Check if the new quantity exceeds the available inventory
        if (newQuantity > product.inventory_quantity) {
          throw new BadRequestException(
            `Cannot update quantity to ${newQuantity}. Only ${product.inventory_quantity} items are available in stock.`,
          );
        }

        // Update the quantity if the product exists
        cartProduct.quantity = newQuantity;
        await this.cartProductRepo.save(cartProduct);
      } else {
        // Add the new cart product if it doesn't exist
        cartProduct = this.cartProductRepo.create({
          cart,
          product,
          quantity: newQuantity,
        });
        cart.cart_products.push(cartProduct);
        await this.cartProductRepo.save(cartProduct);
      }
    }

    // Return the updated cart with product details
    return this.cartRepo
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.cart_products', 'cartProduct')
      .leftJoinAndSelect('cartProduct.product', 'product')
      .select(['cart', 'product.id', 'product.name', 'cartProduct.quantity'])
      .where('cart.user.id = :userId', { userId: user_id })
      .getOne();
  }

  // ! Delete a cart product
  async deleteCartProduct(data: CartDeleteProductDto): Promise<Cart> {
    const { userId, productId } = data;

    const cart = await this.cartRepo.findOne({
      where: { user: { id: userId } },
      relations: ['cart_products', 'cart_products.product'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart for user with id ${userId} not found`);
    }

    const cartProduct = cart.cart_products.find(
      (cp) => cp.product.id === productId,
    );

    if (!cartProduct) {
      throw new NotFoundException(
        `Product with id ${productId} not found in the cart`,
      );
    }

    await this.cartProductRepo.remove(cartProduct);

    // Reload the cart with updated products
    return this.cartRepo
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.cart_products', 'cartProduct')
      .leftJoinAndSelect('cartProduct.product', 'product')
      .select(['cart', 'product.id', 'product.name', 'cartProduct.quantity'])
      .where('cart.user.id = :userId', { userId })
      .getOne();
  }

  // ! Get cart products for user
  async getCartProducts(userId: string) {
    const cart = await this.cartRepo.findOne({
      where: { user: { id: userId } },
      relations: ['cart_products', 'cart_products.product'],
    });

    if (!cart) {
      throw new NotFoundException(`No cart found for user with id ${userId}`);
    }

    // Include the cart id along with the cart products
    return {
      cart_id: cart.id, // Include the cart id
      cart_products: cart.cart_products.map((cartProduct) => ({
        ...cartProduct,
        product: {
          id: cartProduct.product.id,
          name: cartProduct.product.name,
          price: cartProduct.product.price,
          image_url: cartProduct.product.image_url,
          inventory_quantity: cartProduct.product.inventory_quantity,
        },
      })),
    };
  }

  async checkCanPurchaseCartAndCalculateTotal(cartId: string): Promise<number> {
    if (!cartId) {
      throw new BadRequestException('Cart ID cannot be NULL or undefined');
    }

    try {
      // Call the PostgreSQL function to check stock and calculate the total
      const result = await this.dataSource.query(
        'SELECT public.checkcanpurchasecartandcalculatetotal($1)',
        [cartId],
      );

      if (
        !result ||
        !result[0] ||
        result[0].checkcanpurchasecartandcalculatetotal === null
      ) {
        throw new BadRequestException(
          'Unable to calculate total or check stock for this cart',
        );
      }

      // Return the total price calculated by the SQL function
      return parseFloat(result[0].checkcanpurchasecartandcalculatetotal);
    } catch (error) {
      throw new NotFoundException(
        'Error calculating total or checking stock: ' + error.message,
      );
    }
  }

  async calculatePayableAmountWithOwnerShipMemberShip(
    cartId: string,
  ): Promise<number> {
    if (!cartId) {
      throw new BadRequestException('Cart ID cannot be NULL or undefined');
    }

    try {
      // Call the PostgreSQL function to check stock and calculate the total
      const result = await this.dataSource.query(
        'SELECT public.calculate_payable_amount_with_ownership_membership($1)',
        [cartId],
      );

      if (
        !result ||
        !result[0] ||
        result[0].calculate_payable_amount_with_ownership_membership === null
      ) {
        throw new BadRequestException(
          'Unable to calculate payable amount with membership for this cart',
        );
      }

      // Return the total price calculated by the SQL function
      return parseFloat(
        result[0].calculate_payable_amount_with_ownership_membership,
      );
    } catch (error) {
      throw new NotFoundException(
        'Error calculating payable amount with membership: ' + error.message,
      );
    }
  }
}
