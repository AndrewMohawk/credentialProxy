import { prisma } from '../../db/prisma';

describe('Prisma Database Module', () => {
  test('should export a Prisma client instance', () => {
    expect(prisma).toBeDefined();
  });
}); 