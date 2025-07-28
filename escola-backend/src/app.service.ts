import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { message: string; timestamp: string } {
    return {
      message: 'Synexa-SIS Backend API is running com Hot Reload! 🔥',
      timestamp: new Date().toISOString(),
    };
  }
}
