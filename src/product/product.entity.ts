import { BaseEntity } from 'src/common/base_entity';
import { ProductCategory } from 'src/product-category/product-category.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';

@Entity('Product')
export class Product extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ type: 'float' })
  price: number;

  @Column({ type: 'varchar', nullable: true })
  image_url: string;

  @Column({ type: 'int' })
  inventory_quantity: number;

  @Column({ type: 'int' })
  reorder_point: number;

  @ManyToOne(() => ProductCategory)
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category: ProductCategory;
}
