import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsService } from './sms.service';
import { FeeDemand } from '../fee/fee.entity';
import { Student } from '../student/student.entity';

@Injectable()
export class FeeReminderService {
  private readonly logger = new Logger(FeeReminderService.name);

  constructor(
    @InjectRepository(FeeDemand)
    private readonly demandRepo: Repository<FeeDemand>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly smsService: SmsService,
  ) {}

  @Cron('0 9 * * *', { timeZone: 'Asia/Kolkata' })
  async sendFeeReminders() {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const overdueDemands = await this.demandRepo
      .createQueryBuilder('d')
      .where('d.due_date < :today', { today })
      .andWhere('d.amount_paid < d.amount_due')
      .andWhere('(d.last_sms_sent_at IS NULL OR d.last_sms_sent_at < :cutoff)', { cutoff: sevenDaysAgo })
      .getMany();

    this.logger.log(`Fee reminders: ${overdueDemands.length} overdue demands found`);

    for (const demand of overdueDemands) {
      const student = await this.studentRepo.findOne({
        where: { id: demand.studentId, smsOptOut: false },
      });
      if (!student?.mobile) continue;

      const pending = (+demand.amountDue || 0) - (+demand.amountPaid || 0);
      const message = `प्रिय पालक, ${student.nameMr} यांची ₹${pending} शुल्क बाकी आहे. कृपया ${demand.dueDate} पूर्वी भरावे.`;

      const sent = await this.smsService.sendSms(student.mobile, message);
      if (sent) {
        await this.demandRepo.update(demand.id, { lastSmsSentAt: new Date() });
      }
    }
  }
}
