import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email', // Register the "email" queue
      redis: {
        host: 'localhost', // Redis configuration
        port: 6379,
      },
    }),
  ],
  providers: [QueueService],
  exports: [QueueService, BullModule], // Export QueueService and BullModule
})
export class QueueModule {}
