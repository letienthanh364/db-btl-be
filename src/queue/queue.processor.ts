import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EmailService } from '../email/email.service';

@Processor('email')
export class QueueProcessor {
  constructor(private readonly emailService: EmailService) {}

  @Process('sendOrderConfirmation')
  async handleSendOrderConfirmation(
    job: Job<{ orderID: string; userEmail: string }>,
  ) {
    const { orderID, userEmail } = job.data;
    await this.emailService.sendOrderConfirmationEmail(userEmail, orderID);
    console.log(`Processed email job for Order ID: ${orderID}`);
  }
}
