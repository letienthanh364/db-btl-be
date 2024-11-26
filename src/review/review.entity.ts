import { BaseEntity } from 'src/common/base_entity';
import { Product } from 'src/product/product.entity';
import { User } from 'src/user/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('Review')
export class Review extends BaseEntity {
  @Column({ type: 'float', nullable: true })
  rating: number;

  @Column({ type: 'varchar' })
  comment: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product;

  @ManyToOne(() => Review, (review) => review.replies, { nullable: true })
  @JoinColumn({ name: 'parent_id', referencedColumnName: 'id' })
  parent: Review;

  @Column({ nullable: true })
  parent_id: number;

  @OneToMany(() => Review, (review) => review.parent)
  replies: Review[];
}
