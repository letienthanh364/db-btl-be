import { ApiProperty } from '@nestjs/swagger';
import {
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import * as moment from 'moment-timezone';

@Entity()
export class BaseEntity {
  @ApiProperty({
    description: 'The unique identifier for the entity',
    example: 'c9b1d0ae-d6f7-11ea-87d0-0242ac130003',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The date when the entity was created',
    example: '2023-01-01T12:00:00Z',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    description: 'The date when the entity was deleted',
    example: '2023-01-02T12:00:00Z',
  })
  @DeleteDateColumn()
  deleted_at: Date;

  @ApiProperty({
    description: 'The date when the entity was last updated',
    example: '2023-01-02T12:00:00Z',
  })
  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  @BeforeUpdate()
  setTimeZone() {
    // Ensure that we are always assigning a Date object.
    const hoChiMinhTime = moment.tz('Asia/Ho_Chi_Minh').toDate(); // Use toDate() to get a Date object

    // Assign the created_at and updated_at properties with Date objects
    this.created_at = this.created_at
      ? moment(this.created_at).tz('Asia/Ho_Chi_Minh').toDate()
      : hoChiMinhTime;
    this.updated_at = this.updated_at
      ? moment(this.updated_at).tz('Asia/Ho_Chi_Minh').toDate()
      : hoChiMinhTime;

    if (this.deleted_at) {
      this.deleted_at = moment(this.deleted_at).tz('Asia/Ho_Chi_Minh').toDate(); // Ensure it's a Date object
    }
  }
}
