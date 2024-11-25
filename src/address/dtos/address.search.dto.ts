import { PickType, PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { Address } from '../address.entity';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';

export class AddressSearchDto extends PartialType(
  PickType(Address, ['default_flag', 'city', 'district'] as const),
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
