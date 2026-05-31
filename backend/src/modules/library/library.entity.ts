import { Entity, Column, Index } from 'typeorm';
import { SansthaBaseEntity } from '../../database/base.entity';

export enum BookStatus {
  AVAILABLE = 'available',   // उपलब्ध
  ISSUED = 'issued',         // दिले
  LOST = 'lost',             // हरवले
  DAMAGED = 'damaged',       // खराब
}

/** Library book catalog */
@Entity('library_book')
export class LibraryBook extends SansthaBaseEntity {
  @Column({ name: 'unit_id' })
  unitId: string;

  @Column({ name: 'accession_number', type: 'varchar', nullable: true })
  accessionNumber: string; // प्रवेश क्रमांक

  @Column({ name: 'title_mr' })
  titleMr: string; // पुस्तकाचे नाव

  @Column({ name: 'title_en', type: 'varchar', nullable: true })
  titleEn: string;

  @Column({ name: 'author_mr', type: 'varchar', nullable: true })
  authorMr: string; // लेखक

  @Column({ name: 'publisher', type: 'varchar', nullable: true })
  publisher: string; // प्रकाशक

  @Column({ name: 'subject', type: 'varchar', nullable: true })
  subject: string; // विषय

  @Column({ name: 'category', type: 'varchar', nullable: true })
  category: string; // श्रेणी (textbook, reference, story, etc.)

  @Column({ name: 'language', type: 'varchar', nullable: true })
  language: string; // भाषा

  @Column({ name: 'isbn', type: 'varchar', nullable: true })
  isbn: string;

  @Column({ name: 'price', type: 'decimal', precision: 8, scale: 2, nullable: true })
  price: number;

  @Column({ name: 'total_copies', default: 1 })
  totalCopies: number; // एकूण प्रती

  @Column({ name: 'available_copies', default: 1 })
  availableCopies: number; // उपलब्ध प्रती

  @Column({ name: 'rack_number', type: 'varchar', nullable: true })
  rackNumber: string; // रॅक क्रमांक

  @Column({ name: 'status', type: 'enum', enum: BookStatus, default: BookStatus.AVAILABLE })
  status: BookStatus;
}

/** Library issue/return record */
@Entity('library_issue')
export class LibraryIssue extends SansthaBaseEntity {
  @Column({ name: 'unit_id' })
  unitId: string;

  @Column({ name: 'book_id' })
  bookId: string;

  @Column({ name: 'member_type' }) // 'student' | 'staff'
  memberType: string;

  @Column({ name: 'member_id' })
  memberId: string;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Column({ name: 'return_date', type: 'date', nullable: true })
  returnDate: string;

  @Column({ name: 'fine_amount', type: 'decimal', precision: 8, scale: 2, default: 0 })
  fineAmount: number; // दंड

  @Column({ name: 'issued_by', type: 'varchar' })
  issuedBy: string; // ग्रंथपालक userId

  @Column({ name: 'remarks', type: 'varchar', nullable: true })
  remarks: string;

  @Column({ name: 'is_returned', default: false })
  isReturned: boolean;
}
