import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { message: string; timestamp: string } {
    return {
      message: 'Synexa-SIS Backend API is running\!',
      timestamp: new Date().toISOString(),
    };
  }
}
