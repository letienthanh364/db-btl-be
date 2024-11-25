import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const PAGINATION_LIMIT = 20;

export class PaginatedResult<T> {
  @ApiProperty({
    description: 'Array of data items',
    isArray: true,
    type: Object,
  })
  data: T[];

  @ApiProperty({ description: 'Total count of items' })
  count: number;

  @ApiProperty({ description: 'Total number of pages' })
  numberOfPages: number;

  @ApiProperty({ description: 'Indicates if there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Indicates if there is a previous page' })
  hasPrevious: boolean;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  constructor(
    data: T[],
    count: number,
    numberOfPages: number,
    hasNext: boolean,
    hasPrevious: boolean,
    limit: number,
    page: number,
  ) {
    this.data = data;
    this.count = count;
    this.numberOfPages = numberOfPages;
    this.hasNext = hasNext;
    this.hasPrevious = hasPrevious;
    this.limit = limit;
    this.page = page;
  }
}

export class PaginationDto {
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
