import { PickType, PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { Membership } from '../membership.entity';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';

export class MembershipSearchDto extends PartialType(
  PickType(Membership, [
    'deduct_rate',
    'deduct_limit',
    'deduct_available',
  ] as const),
) {
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
