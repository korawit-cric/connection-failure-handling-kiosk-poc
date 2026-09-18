import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@repo/prisma';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LinksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.LinkCreateInput) {
    return this.prisma.client.link.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.client.link.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const link = await this.prisma.client.link.findUnique({
      where: { id },
    });

    if (!link) {
      throw new NotFoundException(`Link with ID ${id} not found`);
    }

    return link;
  }

  async update(id: number, data: Prisma.LinkUpdateInput) {
    await this.findOne(id); // Check if link exists

    return this.prisma.client.link.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if link exists

    return this.prisma.client.link.delete({
      where: { id },
    });
  }
}
