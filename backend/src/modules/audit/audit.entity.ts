import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

@Entity('audit_log')
@Index(['entityType', 'entityId'])
@Index(['userId'])
export class AuditLog extends BaseEntity {
  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'user_name_mr', nullable: true })
  userNameMr: string;

  @Column({ name: 'sanstha_id', nullable: true })
  sansthaId: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ name: 'entity_type' })
  entityType: string;

  @Column({ name: 'entity_id', nullable: true })
  entityId: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;
}
