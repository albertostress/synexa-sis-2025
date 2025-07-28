import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check da aplicação - Hot Reload Test' })
  @ApiResponse({ status: 200, description: 'Aplicação funcionando com hot reload' })
  getHello(): { message: string; timestamp: string } {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint para Docker' })
  @ApiResponse({ status: 200, description: 'Aplicação saudável' })
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  }
}