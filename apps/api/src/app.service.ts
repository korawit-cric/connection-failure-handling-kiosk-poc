import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'NestJS API',
      description: 'REST API with Prisma ORM',
      version: '1.0.0',
      docs: '/api',
      endpoints: {
        swagger: 'GET /api',
        links: 'GET /links',
      },
    };
  }
}
