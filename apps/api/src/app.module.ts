import { KioskService } from './kiosk/kiosk.service';
import { KioskController } from './kiosk/kiosk.controller';
import { Module } from '@nestjs/common';

import { LinksModule } from './links/links.module';
import { PrismaModule } from './prisma/prisma.module';

import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [PrismaModule, LinksModule],
  controllers: [AppController, KioskController],
  providers: [AppService, KioskService],
})
export class AppModule {}
