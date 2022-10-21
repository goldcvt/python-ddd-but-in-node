import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { assert, expect } from 'chai';
import type { BatchInterface } from '../models.interfaces';
import { OrderLine, Batch, allocate } from '../models';
import { SqliteBatchesRepository } from './repo.sqlite';

// TODO: make integration test, require docker + postgres
const prisma = new PrismaClient();
const generateRef = () => randomBytes(10).toString('hex');
const createBatchAndOrderLine = (
    orderRef: string,
    sku: string,
    batchEta?: Date,
) =>
    [
        new OrderLine(orderRef, sku, 2),
        new Batch(generateRef(), sku, 10, batchEta),
    ] as const;
describe('Repos', () => {
    after(async () => {
        await prisma.$disconnect();
    });
    describe('Batch repository', () => {
        const sqliteRepo = new SqliteBatchesRepository(prisma);
        beforeEach(async () => {
            await prisma.$executeRaw`DELETE FROM allocations`;
            await prisma.$executeRaw`DELETE FROM order_lines`;
            await prisma.$executeRaw`DELETE FROM batches`;
        });
        after(async () => {
            await prisma.$executeRaw`DELETE FROM allocations`;
            await prisma.$executeRaw`DELETE FROM order_lines`;
            await prisma.$executeRaw`DELETE FROM batches`;
        });
        it('Batch repository can add simple', async () => {
            const ref = generateRef();
            const sku = 'WHY';
            const [line, batch] = createBatchAndOrderLine(ref, sku, new Date());
            await sqliteRepo.add(batch);
            const rawResult: BatchInterface[] | undefined =
                await prisma.$queryRaw`SELECT * FROM batches WHERE sku = ${sku}`;
            expect(rawResult?.[0]?.ref).to.be.equal(batch.ref);
            expect(rawResult?.[0]?.sku).to.be.equal(batch.sku);
        });
        it('Batch repository can add complex', async () => {
            const ref = generateRef();
            const sku = 'WHY-WHY';
            const [line, batch] = createBatchAndOrderLine(ref, sku, new Date());
            allocate(line, [batch]);
            await sqliteRepo.add(batch);
            const rawResult: BatchInterface[] | undefined =
                await prisma.$queryRaw`SELECT * FROM batches WHERE sku = ${sku}`;
            expect(rawResult?.[0]?.ref).to.be.equal(batch.ref);
            expect(rawResult?.[0]?.sku).to.be.equal(batch.sku);
        });
        it('Batch repository can read', async () => {
            const ref = generateRef();
            const sku = 'WHY-WHY';
            const [line, batch] = createBatchAndOrderLine(ref, sku, new Date());
            allocate(line, [batch]);
            await sqliteRepo.add(batch);
            const dbBatch = await sqliteRepo.get(batch.ref);
            expect(dbBatch).to.be.deep.equal(batch);
        });
    });
});
