import { PickType } from '@nestjs/swagger';
import { Review } from '../review.entity';
import { Optional } from '@nestjs/common';

export class ReviewCreateDto extends PickType(Review, ['comment'] as const) {
  @Optional()
  rating: number;

  @Optional()
  parent_id: string;

  user_id: string;

  product_id: string;
}
