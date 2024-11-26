import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Review } from './review.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ReviewCreateDto } from './dtos/review.create.dto';
import { ReviewSearchDto } from './dtos/review.search.dto';
import { PaginatedResult } from 'src/common/paginated-result';
import { Product } from 'src/product/product.entity';
import { User } from 'src/user/user.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  // ! Find by id
  async findOne(id: string): Promise<Review> {
    return this.reviewRepo.findOneBy({ id });
  }

  // ! Search with params
  async search(params: ReviewSearchDto): Promise<PaginatedResult<Review>> {
    const query = this.reviewRepo
      .createQueryBuilder('review')
      .leftJoin('review.user', 'user')
      .addSelect(['user.id', 'user.name'])
      .leftJoin('review.product', 'product')
      .addSelect(['product.id', 'product.name'])
      .leftJoin('review.replies', 'reply')
      .addSelect(['reply.id', 'reply.comment'])
      .leftJoin('reply.user', 'replyUser') // Join user for replies
      .addSelect(['replyUser.id', 'replyUser.name']);

    if (params.user_id) {
      query.andWhere('user.id = :userId', {
        userId: params.user_id,
      });
    }

    if (params.product_id) {
      query.andWhere('product.id = :productId', {
        productId: params.product_id,
      });
    }

    if (params.parent_id) {
      query.andWhere('review.parent_id = :parentId', {
        parentId: params.parent_id,
      });
    } else {
      query.andWhere('review.parent_id IS NULL');
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

    return new PaginatedResult<Review>(
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
  async create(reviewCreateDto: ReviewCreateDto): Promise<Review> {
    const { user_id, product_id, parent_id, rating, comment } = reviewCreateDto;

    // Validate User
    const user = await this.userRepo.findOne({ where: { id: user_id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found.`);
    }

    // Validate Product
    const product = await this.productRepo.findOne({
      where: { id: product_id },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found.`);
    }

    let parentReview: Review | undefined;

    if (parent_id) {
      // Validate Parent Review
      parentReview = await this.reviewRepo.findOne({
        where: { id: parent_id },
        relations: ['product'],
      });
      if (!parentReview) {
        throw new NotFoundException(
          `Parent review with ID ${parent_id} not found.`,
        );
      }

      // Ensure the reply is for the same product as the parent review
      if (parentReview.product.id !== product_id) {
        throw new BadRequestException(
          `The reply must be for the same product as the parent review.`,
        );
      }
    } else {
      // If no parent_id, ensure the rating is provided
      if (rating === undefined) {
        throw new BadRequestException('Root reviews must include a rating.');
      }
    }

    // Create Review
    const review = this.reviewRepo.create({
      user,
      product,
      parent: parentReview,
      comment,
      rating: parent_id ? undefined : rating, // Root review must have a rating, replies may not
    });

    // Save Review
    const newReview = await this.reviewRepo.save(review);

    const result = await this.reviewRepo
      .createQueryBuilder('review')
      .leftJoin('review.user', 'user')
      .leftJoin('review.product', 'product')
      .leftJoin('review.parent', 'parent')
      .select([
        'review.id', // Review ID
        'review.created_at', // Review ID
        'review.comment', // Review comment
        'review.rating', // Review rating
        'user.id', // User ID
        'user.name', // User name
        'product.id', // Product ID
        'product.name', // Product name
        'parent.id', // Parent review ID
        'parent.comment', // Parent review comment
      ])
      .where('review.id = :id', { id: newReview.id })
      .getOne();

    return result;
  }
}
