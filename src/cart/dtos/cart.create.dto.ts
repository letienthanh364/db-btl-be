export class CartCreateDto {
  user_id: string;
  cart_products: {
    product_id: string;
    quantity: number;
  }[];
}
