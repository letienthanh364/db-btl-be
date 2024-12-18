import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  // Simulate the email transporter
  private transporter = {
    sendMail: async (mailOptions: any) => {
      // Log the mail options to simulate sending an email
      console.log('Simulated email sending with the following details:');
      console.log(`From: ${mailOptions.from}`);
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Text: ${mailOptions.text}`);
      // Simulate a successful send operation
      return { response: '250 Message accepted' };
    },
  };

  async sendOrderConfirmationEmail(to: string, orderID: string): Promise<void> {
    const mailOptions = {
      from: 'noreply@example.com',
      to,
      subject: 'Order Confirmation',
      text: `Your order with Order ID ${orderID} has been confirmed!`,
    };

    // Use the simulated transporter to "send" the email
    const info = await this.transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.response}`);
  }
}
