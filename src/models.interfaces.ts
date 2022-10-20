export type BatchInterface = {
    ref: string;
    sku: string;
    purchasedQuantity: number;
    eta: Date | undefined;
    allocations: Set<OrderLineInterface>;

    canAllocate(orderLine: OrderLineInterface): boolean;
    addAllocation(orderLine: OrderLineInterface): void;
    removeAllocation(orderLine: OrderLineInterface): boolean;
};

export type OrderLineInterface = {
    readonly orderRef: string;
    readonly sku: string;
    readonly quantity: number;
};

export type AllocateDomainService = (
    orderLine: OrderLineInterface,
    batches: BatchInterface[],
) => string | undefined;
