import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type {
  PublishRequest,
  QuoteRequest,
  PayRequest,
  OutboxEvent,
} from '@repo/api-client';
import { KioskService } from './kiosk.service';
@Controller('kiosk')
export class KioskController {
  constructor(private readonly service: KioskService) {}
  @Get('menu/version')
  revision() {
    return this.service.revision();
  }
  @Get('menu') menu() {
    return this.service.menu();
  }
  @Get('versions') versions() {
    return this.service.versions();
  }
  @Post('menu') publish(@Body() body: PublishRequest) {
    return this.service.publish(body);
  }
  @Post('quote') quote(@Body() body: QuoteRequest) {
    return this.service.quote(body);
  }
  @Post('pay') pay(@Body() body: PayRequest) {
    return this.service.pay(body);
  }
  @Post('pay/:id/reconcile') reconcile(@Param('id') id: string) {
    return this.service.reconcile(id);
  }
  @Get('payments') payments() {
    return this.service.payments();
  }
  @Post('events') events(@Body() body: OutboxEvent[]) {
    return this.service.events(body);
  }
}
