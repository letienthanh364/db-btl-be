import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  async addEmailJob(orderID: string, userEmail: string): Promise<void> {
    await this.emailQueue.add('sendOrderConfirmation', {
      orderID,
      userEmail,
    });
  }
}
