import { Entity, Column } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';

export interface ReportColumnDef {
  field: string;          // SQL alias from the query
  label: string;          // Display label (Marathi)
  type: 'text' | 'number' | 'currency' | 'date';
  width?: number;
}

@Entity('report_template')
export class ReportTemplate extends SansthaBaseEntity {
  @Column({ name: 'name_mr' })
  nameMr: string;

  /**
   * One of: 'students' | 'fee_demands' | 'fee_payments' | 'staff' | 'exam_marks'
   */
  @Column({ name: 'data_source' })
  dataSource: string;

  /** Ordered list of columns the user wants to see */
  @Column({ type: 'jsonb', default: '[]' })
  columns: ReportColumnDef[];

  /** Saved filter values the user can use as defaults at runtime */
  @Column({ name: 'default_filters', type: 'jsonb', default: '{}' })
  defaultFilters: Record<string, any>;

  @Column({ name: 'sort_by', nullable: true })
  sortBy?: string;

  @Column({ name: 'sort_dir', default: 'ASC' })
  sortDir: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
