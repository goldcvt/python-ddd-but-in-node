import type { AbstractBatchesRepository } from 'repo.interfaces';
import type { Allocation, PrismaClient } from '@prisma/client';
import type { BatchInterface, OrderLineInterface } from 'models.interfaces';
import { Batch } from '../models';
import { prismaCreateAdapter, prismaGetAdapter } from './prisma.adapters';

export class SqliteBatchesRepository implements AbstractBatchesRepository {
    sqlite: PrismaClient;
    constructor(dbClient: PrismaClient) {
        this.sqlite = dbClient;
    }

    async get(reference: string): Promise<Batch | undefined> {
        const dbBatch = await this.sqlite.batch.findFirst({
            where: {
                ref: {
                    equals: reference,
                },
            },
        });
        if (!dbBatch) {
            return undefined;
        }

        const allocations = await this.sqlite.allocation.findMany({
            where: {
                batchId: {
                    equals: dbBatch.id,
                },
            },
        });
        const orderLines = await this.sqlite.orderLine.findMany({
            where: {
                id: {
                    in: allocations.map(
                        (alloc: Allocation) => alloc.orderlineId,
                    ),
                },
            },
            select: {
                orderRef: true,
                sku: true,
                quantity: true,
            },
        });

        const { sku, ref, purchasedQuantity, eta } = dbBatch;
        const batch = new Batch(
            ref,
            sku,
            purchasedQuantity,
            prismaGetAdapter(eta),
        );
        for (const line of orderLines) {
            batch.addAllocation(line);
        }

        return batch;
    }

    async add(batch: BatchInterface) {
        const dbBatch = await this.sqlite.batch.create({
            data: {
                ref: batch.ref,
                sku: batch.sku,
                purchasedQuantity: batch.purchasedQuantity,
                eta: prismaCreateAdapter(batch.eta),
            },
        });
        if (batch.allocations.size > 0) {
            const [...allocations] = await this.sqlite.$transaction(
                [...batch.allocations].map((line: OrderLineInterface) => {
                    const { sku, orderRef, quantity } = line;
                    return this.sqlite.allocation.create({
                        data: {
                            orderline: {
                                create: {
                                    sku,
                                    orderRef,
                                    quantity,
                                },
                            },
                            batch: {
                                connect: {
                                    id: dbBatch.id,
                                },
                            },
                        },
                    });
                }),
            );
        }
    }
}
