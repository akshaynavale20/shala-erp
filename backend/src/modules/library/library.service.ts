import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LibraryBook, LibraryIssue, BookStatus } from './library.entity';

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(LibraryBook) private readonly bookRepo: Repository<LibraryBook>,
    @InjectRepository(LibraryIssue) private readonly issueRepo: Repository<LibraryIssue>,
  ) {}

  // ── Books ───────────────────────────────────────────────────────────────────

  async addBook(dto: Partial<LibraryBook>): Promise<LibraryBook> {
    const book = this.bookRepo.create({ ...dto, availableCopies: dto.totalCopies ?? 1 });
    return this.bookRepo.save(book);
  }

  async findBooks(unitId: string, search?: string): Promise<LibraryBook[]> {
    const qb = this.bookRepo.createQueryBuilder('b')
      .where('b.unit_id = :unitId', { unitId })
      .andWhere('b.is_active = true');
    if (search) {
      qb.andWhere('(b.title_mr ILIKE :s OR b.title_en ILIKE :s OR b.author_mr ILIKE :s OR b.accession_number ILIKE :s)', { s: `%${search}%` });
    }
    return qb.orderBy('b.accession_number', 'ASC').getMany();
  }

  async updateBook(id: string, dto: Partial<LibraryBook>): Promise<LibraryBook> {
    const book = await this.bookRepo.findOne({ where: { id } });
    if (!book) throw new NotFoundException('पुस्तक सापडले नाही');
    Object.assign(book, dto);
    return this.bookRepo.save(book);
  }

  // ── Issue / Return ─────────────────────────────────────────────────────────

  async issueBook(dto: {
    unitId: string; sansthaId: string; bookId: string; memberType: string; memberId: string;
    issueDate: string; dueDate: string; issuedBy: string;
  }): Promise<LibraryIssue> {
    const book = await this.bookRepo.findOne({ where: { id: dto.bookId } });
    if (!book) throw new NotFoundException('पुस्तक सापडले नाही');
    if (book.availableCopies <= 0) throw new BadRequestException('पुस्तकाची प्रत उपलब्ध नाही');

    book.availableCopies -= 1;
    if (book.availableCopies === 0) book.status = BookStatus.ISSUED;
    await this.bookRepo.save(book);

    return this.issueRepo.save(this.issueRepo.create(dto));
  }

  async returnBook(issueId: string, returnDate: string, fineAmount = 0): Promise<LibraryIssue> {
    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue || issue.isReturned) throw new NotFoundException('नोंद सापडली नाही');

    issue.returnDate = returnDate;
    issue.fineAmount = fineAmount;
    issue.isReturned = true;
    await this.issueRepo.save(issue);

    // Update book availability
    const book = await this.bookRepo.findOne({ where: { id: issue.bookId } });
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      if (book.availableCopies > 0 && book.status === BookStatus.ISSUED) book.status = BookStatus.AVAILABLE;
      await this.bookRepo.save(book);
    }
    return issue;
  }

  async getActiveIssues(unitId: string): Promise<LibraryIssue[]> {
    return this.issueRepo.find({
      where: { unitId, isReturned: false },
      order: { dueDate: 'ASC' },
    });
  }

  async getMemberIssues(memberId: string): Promise<LibraryIssue[]> {
    return this.issueRepo.find({
      where: { memberId },
      order: { issueDate: 'DESC' },
    });
  }

  async getOverdueBooks(unitId: string): Promise<LibraryIssue[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.issueRepo
      .createQueryBuilder('i')
      .where('i.unit_id = :unitId', { unitId })
      .andWhere('i.is_returned = false')
      .andWhere('i.due_date < :today', { today })
      .orderBy('i.due_date', 'ASC')
      .getMany();
  }

  async getStats(unitId: string): Promise<any> {
    const totalBooks = await this.bookRepo.count({ where: { unitId } });
    const issuedCount = await this.issueRepo.count({ where: { unitId, isReturned: false } });
    const today = new Date().toISOString().split('T')[0];
    const overdueCount = await this.issueRepo
      .createQueryBuilder('i')
      .where('i.unit_id = :unitId', { unitId })
      .andWhere('i.is_returned = false')
      .andWhere('i.due_date < :today', { today })
      .getCount();
    return { totalBooks, issuedCount, overdueCount, availableBooks: totalBooks - issuedCount };
  }
}
