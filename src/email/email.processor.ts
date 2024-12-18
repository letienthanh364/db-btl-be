import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('email')
export class EmailProcessor {
  @Process('sendOrderConfirmation')
  async handleOrderConfirmation(
    job: Job<{ orderID: string; userEmail: string }>,
  ) {
    const { orderID, userEmail } = job.data;

    // Simulate sending email
    console.log(
      `Sending order confirmation email to ${userEmail} for Order ID: ${orderID}`,
    );
    // Replace with actual email sending logic here (e.g., using Nodemailer or SendGrid)
  }
}
