import { ApiPropertyOptional } from '@nestjs/swagger';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';

export class CartSearchDto {
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
