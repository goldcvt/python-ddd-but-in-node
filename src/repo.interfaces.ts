import type { BatchInterface } from 'models.interfaces';

export type AbstractBatchesRepository = {
    get(ref: string): Promise<BatchInterface | undefined>;
    add(batch: BatchInterface): Promise<void>;
};
