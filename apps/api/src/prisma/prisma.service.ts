import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import prisma from '@repo/prisma';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  get client() {
    return prisma;
  }

  async onModuleInit() {
    // Optional: Connect to database on module init
    await prisma.$connect();
  }

  async onModuleDestroy() {
    // Disconnect from database on module destroy
    await prisma.$disconnect();
  }
}
