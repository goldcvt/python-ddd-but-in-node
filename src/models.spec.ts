import { randomBytes } from 'node:crypto';
import { assert, expect } from 'chai';
import { allocate, OrderLine, Batch } from './models';

const today = new Date();
const dayInSeconds = 24 * 3600 * 1000;
const tomorrow = new Date(today.getTime() + dayInSeconds);
const tenDays = 10 * dayInSeconds;
const later = new Date(today.getTime() + tenDays);
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

describe('Allocation', () => {
    it('Allocating order lines decreases batch size', () => {
        const [orderLine, batch] = createBatchAndOrderLine(
            generateRef(),
            'RED-LAMP',
            today,
        );
        expect(batch.availableQuantity).to.be.equal(10);
        allocate(orderLine, [batch]);
        expect(batch.availableQuantity).to.be.equal(8);
    });
    it('Allocating different order lines decreases batch size multiple times', () => {
        const [orderLine, batch] = createBatchAndOrderLine(
            generateRef(),
            'RED-LAMP',
            today,
        );
        const newOrderlLine = new OrderLine(generateRef(), 'RED-LAMP', 3);
        expect(batch.availableQuantity).to.be.equal(10);
        allocate(orderLine, [batch]);
        allocate(newOrderlLine, [batch]);
        expect(batch.availableQuantity).to.be.equal(5);
    });
    it('Cannot allocate same order line twice', () => {
        const [orderLine, batch] = createBatchAndOrderLine(
            generateRef(),
            'RED-LAMP',
            today,
        );
        expect(batch.availableQuantity).to.be.equal(10);
        allocate(orderLine, [batch]);
        allocate(orderLine, [batch]);
        expect(batch.availableQuantity).to.be.equal(8);
    });
    it('Cannot allocate if order line quantity less than batch', () => {
        const [orderLine, batch] = createBatchAndOrderLine(
            generateRef(),
            'RED-LAMP',
            today,
        );
        const newOrderlLine = new OrderLine(generateRef(), 'RED-LAMP', 13);
        expect(batch.availableQuantity).to.be.equal(10);
        allocate(newOrderlLine, [batch]);
        expect(batch.availableQuantity).to.be.equal(10);
    });
    it('Allocation returns used batch ref', () => {
        const sku = 'RED-LAMP';
        const [orderLine, batch] = createBatchAndOrderLine(
            generateRef(),
            sku,
            today,
        );
        const allocatedRef1 = allocate(orderLine, [batch]);
        expect(batch.ref).to.be.equal(allocatedRef1);
    });
    it('Earlier batches are preferred for allocation', () => {
        const sku = 'RED-LAMP';
        const [orderLine, batch] = createBatchAndOrderLine(
            generateRef(),
            sku,
            today,
        );
        const laterBatch = new Batch(generateRef(), sku, 10, later);
        const tomorrowBatch = new Batch(generateRef(), sku, 10, tomorrow);
        expect(batch.availableQuantity).to.be.equal(10);
        const allocatedRef1 = allocate(orderLine, [
            laterBatch,
            tomorrowBatch,
            batch,
        ]);
        expect(batch.ref).to.be.equal(allocatedRef1);
        expect(batch.availableQuantity).to.be.equal(8);
        expect(laterBatch.availableQuantity).to.be.equal(10);
        expect(tomorrowBatch.availableQuantity).to.be.equal(10);

        const allocatedRef2 = allocate(
            {
                ...orderLine,
                orderRef: generateRef(),
            },
            [tomorrowBatch, batch, laterBatch],
        );
        expect(batch.ref).to.be.equal(allocatedRef2);
        expect(batch.availableQuantity).to.be.equal(6);
        expect(laterBatch.availableQuantity).to.be.equal(10);
        expect(tomorrowBatch.availableQuantity).to.be.equal(10);

        const allocatedRef3 = allocate(
            {
                ...orderLine,
                orderRef: generateRef(),
            },
            [batch, laterBatch, tomorrowBatch],
        );
        expect(batch.ref).to.be.equal(allocatedRef3);
        expect(batch.availableQuantity).to.be.equal(4);
        expect(laterBatch.availableQuantity).to.be.equal(10);
        expect(tomorrowBatch.availableQuantity).to.be.equal(10);
    });
    it('In-stock batches are preferred over shipment batches for allocation', () => {
        const sku = 'RED-LAMP';
        const [orderLine, batch] = createBatchAndOrderLine(generateRef(), sku);
        const todayBatch = new Batch(generateRef(), sku, 10, today);
        expect(batch.availableQuantity).to.be.equal(10);
        const allocatedRef1 = allocate(orderLine, [batch, todayBatch]);
        expect(batch.ref).to.be.equal(allocatedRef1);
        expect(batch.availableQuantity).to.be.equal(8);
        expect(todayBatch.availableQuantity).to.be.equal(10);

        const allocatedRef2 = allocate(
            {
                ...orderLine,
                orderRef: generateRef(),
            },
            [todayBatch, batch],
        );
        expect(batch.ref).to.be.equal(allocatedRef2);
        expect(batch.availableQuantity).to.be.equal(6);
        expect(todayBatch.availableQuantity).to.be.equal(10);
    });
});

describe('Batches', () => {
    it('Can deallocate only already allocated lines', () => {
        const [origLine, batch] = createBatchAndOrderLine(
            generateRef(),
            'RED-LAMP',
            today,
        );
        allocate(origLine, [batch]);
        const orderLine = new OrderLine(generateRef(), 'GREEN-LANTERN', 1);
        expect(batch.removeAllocation(orderLine)).to.be.false;
        return expect(batch.removeAllocation(origLine)).to.be.true;
    });
    it('Cannot allocate if sku dont match', () => {
        const [, batch] = createBatchAndOrderLine(
            generateRef(),
            'RED-LAMP',
            today,
        );
        const orderLine = new OrderLine(generateRef(), 'GREEN-LANTERN', 1);
        return expect(batch.canAllocate(orderLine)).to.be.false;
    });
    it('Can allocate if order qty equal to batch qty', () => {
        const [, batch] = createBatchAndOrderLine(
            generateRef(),
            'RED-LAMP',
            today,
        );
        const orderLine = new OrderLine(generateRef(), 'RED-LAMP', 10);
        return expect(batch.canAllocate(orderLine)).to.be.true;
    });
    it('Cannot allocate if order qty more than batch qty', () => {
        const [, batch] = createBatchAndOrderLine(
            generateRef(),
            'RED-LAMP',
            today,
        );
        const orderLine = new OrderLine(generateRef(), 'RED-LAMP', 12);
        return expect(batch.canAllocate(orderLine)).to.be.false;
    });
    it('Can allocate if order qty less than batch qty', () => {
        const [, batch] = createBatchAndOrderLine(
            generateRef(),
            'RED-LAMP',
            today,
        );
        const orderLine = new OrderLine(generateRef(), 'RED-LAMP', 1);
        return expect(batch.canAllocate(orderLine)).to.be.true;
    });
});
