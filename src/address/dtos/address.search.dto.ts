import { PickType, PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';
import { Address } from '../address.entity';

export class AddressSearchDto extends PartialType(
  PickType(Address, ['default_flag', 'province', 'district'] as const),
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
