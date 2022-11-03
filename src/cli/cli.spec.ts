import fs from 'node:fs';
import { expect } from 'chai';
import { FileHashesMap, determineActions } from './cli';

describe("Sync thing, plain ol' determineActions", () => {
    const srcFolder = 'tmp';
    const destFolder = 'tmp2';
    it('File exists in a source but not dest', () => {
        const src: FileHashesMap = new Map();
        src.set('hash1', `file1`);
        src.set('hash2', `folder/file2`);
        const dest: FileHashesMap = new Map();
        const actions = [...determineActions(src, dest, srcFolder, destFolder)];
        console.log(actions);
        expect(actions).to.be.deep.equal([
            ['COPY', 'tmp/file1', 'tmp2/file1'],
            ['COPY', 'tmp/folder/file2', 'tmp2/folder/file2'],
        ]);
    });
});
