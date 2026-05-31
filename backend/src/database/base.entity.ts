import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export abstract class SansthaBaseEntity extends BaseEntity {
  @Column({ name: 'sanstha_id' })
  sansthaId: string;
}

export abstract class UnitBaseEntity extends SansthaBaseEntity {
  @Column({ name: 'unit_id' })
  unitId: string;
}
