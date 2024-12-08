export class OrderCreateDto {
  user_id: string;

  address: string;

  use_discount?: boolean;

  order_products: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
}
