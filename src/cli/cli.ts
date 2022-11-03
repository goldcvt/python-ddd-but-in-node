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

export type FileHashesMap = Map<HashedFile, string>;
type Actions = 'COPY' | 'MOVE' | 'DELETE';

const actions = {
    COPY: (src: string, dest: string) => {
        // actually copy
    },
    MOVE: (src: string, dest: string) => {
        // actually move
    },
    DELETE: (src: string, dest: string) => {
        // actually delete
    },
    // yup. I'm lazy, I don't give a fuck
} as const;

export const collectHashes = (dir: string) => {
    const files: FileHashesMap = new Map();
    for (const filePath in fs.readdirSync(dir)) {
        const fileHash = hashFile(path.resolve(dir, filePath));
        files.set(fileHash, filePath);
    }

    return files;
};

// naive but whatever
const concatPaths = (paths: string[]) => {
    return paths.reduce((prev: string, curr: string) => {
        return prev + '/' + curr;
    }, paths[0] ?? '');
};
export function* determineActions(
    sourceHashes: FileHashesMap,
    destHashes: FileHashesMap,
    source: string,
    dest: string,
): Generator<[Actions, string, string]> {
    for (const [sourceHash, sourcePath] of sourceHashes.entries()) {
        const destPath = destHashes.get(sourceHash);
        if (!destPath) {
            yield [
                'COPY',
                concatPaths([source, sourcePath]),
                concatPaths([dest, sourcePath]),
            ];
        }

        if (sourcePath !== destPath) {
            yield [
                'MOVE',
                concatPaths([dest, destPath!]),
                concatPaths([dest, sourcePath]),
            ];
        }
    }

    for (const destHash of destHashes.keys()) {
        const sourcePath = sourceHashes.get(destHash);
        if (!sourcePath) {
            yield ['DELETE', source, dest];
        }
    }
}

// book's solution is better, it's like O(n) vs our O(n^2)
export const sync = (src: string, dest: string): void => {
    const sourceFiles = collectHashes(src);
    const destFiles = collectHashes(dest);

    for (const [action, source, destination] of determineActions(
        sourceFiles,
        destFiles,
        src,
        dest,
    )) {
        actions[action](source, destination);
    }
};
