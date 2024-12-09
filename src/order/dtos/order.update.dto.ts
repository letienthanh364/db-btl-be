export class OrderProductUpdateDto {
  productId: string;
  newQuantity: number;
  isDeleted?: boolean;
}
