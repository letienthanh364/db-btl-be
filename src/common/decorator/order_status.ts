import { SetMetadata } from '@nestjs/common';

export enum OrderStatus {
  Checking = 'busy',
  InDelivery = 'in_delivery',
  Deliveried = 'deliveried',
  Received = 'received',
}

export const ORDER_STATUS_KEYS = 'order_statuses';
export const OrderStatuses = (...statuses: OrderStatus[]) =>
  SetMetadata(ORDER_STATUS_KEYS, statuses);
