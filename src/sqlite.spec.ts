import { Prisma, PrismaClient } from '@prisma/client';
import { expect } from 'chai';
import process from 'process';
import type { Batch } from './models';

const prisma = new PrismaClient();
describe('Prisma generated properly', () => {
    after(async () => {
        await prisma.$disconnect();
    });
    describe('Batches (lame one-table model)', () => {
        after(async () => {
            await prisma.$executeRaw`DELETE FROM batches WHERE ref = 'dropref1'`;
        });
        it('Can be inserted', async () => {
            const ref = 'dropref1';
            const sku = 'red-dong';
            const purchasedQuantity = 10;
            const eta = new Date();
            await prisma.$executeRaw(
                Prisma.sql`INSERT INTO batches(ref, sku, purchased_quantity, eta) 
            VALUES (${ref}, ${sku}, ${purchasedQuantity}, ${eta})`,
            );
        });
        it('Can be read', async () => {
            const result: Batch[] = await prisma.$queryRaw(
                Prisma.sql`SELECT * FROM batches WHERE ref='dropref1'`,
            );
            expect(result[0]?.ref).to.be.equal('dropref1');
            expect(result[0]?.sku).to.be.equal('red-dong');
        });
    });
});
