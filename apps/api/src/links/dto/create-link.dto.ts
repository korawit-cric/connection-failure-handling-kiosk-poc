import { ApiProperty } from '@nestjs/swagger';
import type { Prisma } from '@repo/prisma';

// DTO implements Prisma type - TypeScript enforces alignment
export class CreateLinkDto implements Prisma.LinkCreateInput {
  @ApiProperty({ example: 'https://google.com' })
  url: string;

  @ApiProperty({ example: 'Google' })
  title: string;

  @ApiProperty({ example: 'Search engine', required: false })
  description?: string;
}
