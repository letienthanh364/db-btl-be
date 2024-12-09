import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from 'src/common/decorator/order_status';
import { PAGINATION_LIMIT } from 'src/common/paginated-result';

export class OrderSearchDto {
  user_id?: string;

  // product_id?: string;

  status?: OrderStatus;

  // order_date?: Date;
  start_date?: string;
  end_date?: string;

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
