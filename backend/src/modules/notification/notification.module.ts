import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsService } from './sms.service';
import { FeeReminderService } from './fee-reminder.service';
import { FeeDemand } from '../fee/fee.entity';
import { Student } from '../student/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeeDemand, Student])],
  providers: [SmsService, FeeReminderService],
  exports: [SmsService],
})
export class NotificationModule {}
