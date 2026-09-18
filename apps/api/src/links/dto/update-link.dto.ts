import { ApiProperty } from '@nestjs/swagger';
import type { Prisma } from '@repo/prisma';

// DTO implements Prisma type - TypeScript enforces alignment
export class UpdateLinkDto implements Prisma.LinkUpdateInput {
  @ApiProperty({ example: 'https://google.com', required: false })
  url?: string;

  @ApiProperty({ example: 'Google', required: false })
  title?: string;

  @ApiProperty({ example: 'Search engine', required: false })
  description?: string;
}
