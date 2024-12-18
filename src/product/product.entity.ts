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

  @Column({ type: 'varchar' })
  color: string;

  @Column({ type: 'int' })
  size: string;

  @Column({ type: 'varchar' })
  genderSuit: string;

  @Column({ type: 'varchar' })
  model: string;

  @Column({ type: 'varchar' })
  branch: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

  @Column({ type: 'int' })
  inventoryQuantity: number;

  @Column({ type: 'float' })
  discount: number;

  @ManyToOne(() => ProductCategory)
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category: ProductCategory;
}
