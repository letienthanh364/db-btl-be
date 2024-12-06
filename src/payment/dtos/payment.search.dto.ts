import { PickType, PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';
import { Payment } from '../payment.entity';
import { Optional } from '@nestjs/common';

export class PaymentSearchDto extends PartialType(
  PickType(Payment, ['amount', 'currency'] as const),
) {
  @Optional()
  payment_date?: string;

  @Optional()
  order_id?: string;

  @Optional()
  user_id: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: PAGINATION_LIMIT,
    default: PAGINATION_LIMIT,
  })
  limit?: number;
}
