import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { message: string; timestamp: string } {
    return {
      message: 'Escola Backend API está funcionando! 🎓',
      timestamp: new Date().toISOString(),
    };
  }
}