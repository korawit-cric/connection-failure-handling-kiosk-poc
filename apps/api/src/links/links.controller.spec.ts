import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { LinksController } from './links.controller';
import { LinksService } from './links.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LinksController', () => {
  let controller: LinksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinksController],
      providers: [
        LinksService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              link: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    controller = module.get<LinksController>(LinksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
