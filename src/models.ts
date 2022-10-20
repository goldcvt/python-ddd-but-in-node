import { randomBytes } from 'node:crypto';
import type {
    AllocateDomainService,
    BatchInterface,
    OrderLineInterface,
} from 'models.interfaces';

export class OutOfStockError extends Error {}

export class OrderLine implements OrderLineInterface {
    constructor(
        readonly orderRef: string,
        readonly sku: string,
        readonly quantity: number,
    ) {}
}

export class Batch implements BatchInterface {
    eta: Date | undefined = undefined;
    allocations = new Set<OrderLineInterface>();
    purchasedQuantity: number;

    constructor(
        readonly ref: string,
        public sku: string,
        quantity: number,
        eta?: Date,
    ) {
        if (eta) {
            this.eta = eta;
        }

        this.purchasedQuantity = quantity;
    }

    get availableQuantity() {
        return this.purchasedQuantity - this.allocatedTotal;
    }

    get allocatedTotal() {
        return [...this.allocations]
            .map((allocation: OrderLineInterface) => allocation.quantity)
            .reduce(
                (previous: number, current: number) => previous + current,
                0,
            );
    }

    canAllocate(orderLine: OrderLineInterface) {
        return (
            orderLine.sku === this.sku &&
            this.availableQuantity >= orderLine.quantity
        );
    }

    addAllocation(orderLine: OrderLineInterface): void {
        if (this.canAllocate(orderLine)) {
            this.allocations.add(orderLine);
        }
    }

    removeAllocation(orderLine: OrderLineInterface): boolean {
        return this.allocations.delete(orderLine);
    }
}

export const allocate: AllocateDomainService = (
    orderLine: OrderLineInterface,
    batches: BatchInterface[],
) => {
    const sortedBatches = [...batches].sort(
        (batchA: BatchInterface, batchB: BatchInterface) =>
            (batchA.eta?.getTime() ?? 0) - (batchB.eta?.getTime() ?? 0),
    );
    for (const batch of sortedBatches) {
        if (batch.canAllocate(orderLine)) {
            batch.addAllocation(orderLine);
            return batch.ref;
        }
    }

    throw new OutOfStockError('Completely out of stock :(');
};
