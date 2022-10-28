import fs from 'node:fs';
import { sync } from './cli';
import { expect } from 'chai';
describe('Sync think', () => {
    it('File exists in a source but not dest', () => {
        try {
            const source = fs.mkdtempSync('./src/cli/source/s');
            const dest = fs.mkdtempSync('./src/cli/dest/d');
            const fileContent = 'Yikesies!';
            fs.writeFileSync(`${source}/file1.txt`, fileContent);

            sync(source, dest);

            const destContents = fs.readdirSync(`${dest}`);
            expect(destContents).to.be.deep.equal(['file1.txt']);
            fs.rmdirSync(`${source}`);
            fs.rmdirSync(`${dest}`);
        } finally {
        }
    });
});
