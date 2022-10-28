import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
// copy
// rename
// delete
type HashedFile = string;
const hashFile = (filepath: string): HashedFile => {
    const fileBuffer = fs.readFileSync(filepath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);

    return hashSum.digest('hex');
};

// book's solution is better, it's like O(n) vs our O(n^2)
export const sync = (source: string, dest: string): void => {
    const sourceFiles: Record<string, HashedFile> = {};
    const destFiles: Record<string, HashedFile> = {};
    for (const sourcePath in fs.readdirSync(source)) {
        sourceFiles[sourcePath] = hashFile(sourcePath);
    }

    for (const destPath in fs.readdirSync(dest)) {
        destFiles[destPath] = hashFile(destPath);
    }

    for (const [sourcePath, sourceHash] of Object.entries(sourceFiles)) {
        // copy
        if (!(sourcePath in destFiles)) {
            fs.copyFileSync(sourcePath, dest);
            continue;
        }

        for (const [destPath, destHash] of Object.entries(destFiles)) {
            if (destHash === sourceHash && destPath !== sourcePath) {
                // rename
                fs.renameSync(destPath, `${dest}//${sourcePath}`);
                break;
            }

            // delete
            if (!(destPath in sourceFiles)) {
                fs.rmSync(destPath);
                break;
            }
        }
    }
};
