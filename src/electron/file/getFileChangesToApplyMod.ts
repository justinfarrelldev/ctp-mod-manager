import { Change, diffLines } from 'diff';
import fs from 'node:fs';
import pLimit from 'p-limit';
import { ReadonlyDeep } from 'type-fest';

import { DEFAULT_MOD_DIR } from '../constants';
import { diffDirectories } from './diffDirectories';
import { FileChange } from './fileChange';
import {
    LineChangeGroup,
    LineChangeGroupAdd,
    LineChangeGroupRemove,
} from './lineChangeGroup';
import { readDirectory } from './readDirectory';

export const CHUNK_SIZE = 5000; // 5KB chunks for text diffing

/**
 * Splits a given text into chunks of a specified maximum size.
 * Each chunk will contain complete lines and will not exceed the CHUNK_SIZE.
 * @param text - The input text to be split into chunks.
 * @returns An array of strings, where each string is a chunk of the original text.
 */
export const splitIntoChunks = (text: string): string[] => {
    const chunks: string[] = [];
    let currentChunk = '';
    const lines = text.split('\n');

    for (const line of lines) {
        if (
            currentChunk.length + line.length + 1 > CHUNK_SIZE &&
            currentChunk.length > 0
        ) {
            chunks.push(currentChunk);
            currentChunk = line + '\n';
        } else {
            currentChunk += line + '\n';
        }
    }

    if (currentChunk.length > 0) {
        // Remove trailing newline if original text didn't end with newline
        if (!text.endsWith('\n') && currentChunk.endsWith('\n')) {
            currentChunk = currentChunk.slice(0, -1);
        }
        chunks.push(currentChunk);
    }

    return chunks;
};

/**
 * Asynchronously computes the line-by-line differences between two strings.
 * @param text1 - The first string to compare.
 * @param text2 - The second string to compare.
 * @returns A promise that resolves to an array of changes.
 * This function uses the `diffLines` method to compute the differences. The `newlineIsToken` option is set to `true`.
 * The callback function's first parameter is an undocumented and always undefined value, which is ignored.
 * The second parameter of the callback is the result array of changes, which is resolved by the promise.
 */
const diffLinesAsync = async (
    text1: string,
    text2: string
): Promise<ReadonlyDeep<Change[]>> => {
    return new Promise<ReadonlyDeep<Change[]>>((resolve) => {
        diffLines(text1, text2, {
            // no idea why this "error" value ('_') is a) undocumented and b) always undefined,
            // but here we are
            callback: (_: undefined, result: ReadonlyDeep<Change[]>) => {
                resolve(result);
            },
            newlineIsToken: true,
        });
    });
};

/**
 * Computes the differences between two text strings and returns an array of changes.
 *
 * This function compares two text strings and returns an array of changes that represent
 * the differences between the two texts. For small strings, it uses `diffLines` directly.
 * For larger strings, it splits them into chunks and processes them concurrently.
 * @param text1 - The first text string to compare.
 * @param text2 - The second text string to compare.
 * @returns A promise that resolves to an array of `Change` objects representing the differences.
 */
export const diffTexts = async (
    text1: string,
    text2: string
): Promise<Change[]> => {
    // For small strings or strings of drastically different sizes, use diffLines directly
    // as the chunking is not very performant when dealing with differently-sized texts
    if (text1.length < CHUNK_SIZE || text2.length < CHUNK_SIZE) {
        return diffLines(text1, text2, {
            newlineIsToken: true,
        });
    }

    const chunks1 = splitIntoChunks(text1);
    const chunks2 = splitIntoChunks(text2);

    // Compare equivalent chunks in parallel
    const minChunks = Math.min(chunks1.length, chunks2.length);
    const limit = pLimit(100);

    const chunkComparisonPromises = Array.from({ length: minChunks }, (_, i) =>
        limit(() => diffLinesAsync(chunks1[i], chunks2[i]))
    );

    // Handle remaining chunks in the longer text
    if (chunks1.length > chunks2.length) {
        for (let i = minChunks; i < chunks1.length; i++) {
            chunkComparisonPromises.push(
                limit(() =>
                    Promise.resolve([
                        {
                            count: chunks1[i].split('\n').length,
                            removed: true,
                            value: chunks1[i],
                        },
                    ])
                )
            );
        }
    } else if (chunks2.length > chunks1.length) {
        for (let i = minChunks; i < chunks2.length; i++) {
            chunkComparisonPromises.push(
                limit(() =>
                    Promise.resolve([
                        {
                            added: true,
                            count: chunks2[i].split('\n').length,
                            value: chunks2[i],
                        },
                    ])
                )
            );
        }
    }

    // Wait for all chunk comparisons to complete and combine results
    const chunkResults = await Promise.all(chunkComparisonPromises);
    return chunkResults.flat();
};

/**
 * Consolidates line change groups by merging matching remove/add pairs into replace operations.
 * @param groups - An array of `LineChangeGroup` objects representing line changes.
 * @returns An array of `LineChangeGroup` objects with consolidated changes.
 *
 * The function processes the input `groups` array and looks for pairs of 'remove' and 'add' changes
 * that affect the same single line range. When such pairs are found, they are replaced with a single
 * 'replace' operation. The function ensures that each change is only used once by keeping track of
 * used indices.
 *
 * Example:
 *
 * Input:
 * [
 *   { changeType: 'remove', startLineNumber: 1, endLineNumber: 1, oldContent: 'foo' },
 *   { changeType: 'add', startLineNumber: 1, endLineNumber: 1, newContent: 'bar' }
 * ]
 *
 * Output:
 * [
 *   { changeType: 'replace', startLineNumber: 1, endLineNumber: 1, oldContent: 'foo', newContent: 'bar' }
 * ]
 */
export const consolidateLineChangeGroups = (
    groups: ReadonlyDeep<LineChangeGroup[]>
): LineChangeGroup[] => {
    const result: LineChangeGroup[] = [];
    const usedIndices = new Set<number>();

    for (let i = 0; i < groups.length; i++) {
        if (usedIndices.has(i)) continue;

        const current = groups[i];
        if (
            (current.changeType === 'remove' || current.changeType === 'add') &&
            current.startLineNumber === current.endLineNumber
        ) {
            for (let j = i + 1; j < groups.length; j++) {
                if (usedIndices.has(j)) continue;
                const next = groups[j];
                if (
                    next.changeType !== current.changeType &&
                    next.startLineNumber === current.startLineNumber &&
                    next.endLineNumber === current.endLineNumber
                ) {
                    // We have a matching remove/add pair with same single line range
                    if (
                        current.changeType === 'remove' &&
                        next.changeType === 'add'
                    ) {
                        result.push({
                            changeType: 'replace',
                            endLineNumber: current.endLineNumber,
                            newContent: (next as LineChangeGroupAdd).newContent,
                            oldContent: (current as LineChangeGroupRemove)
                                .oldContent,
                            startLineNumber: current.startLineNumber,
                        });
                    } else if (
                        current.changeType === 'add' &&
                        next.changeType === 'remove'
                    ) {
                        result.push({
                            changeType: 'replace',
                            endLineNumber: current.endLineNumber,
                            newContent: (current as LineChangeGroupAdd)
                                .newContent,
                            oldContent: (next as LineChangeGroupRemove)
                                .oldContent,
                            startLineNumber: current.startLineNumber,
                        });
                    }
                    usedIndices.add(j);
                    usedIndices.add(i);
                    break;
                }
            }
            if (!usedIndices.has(i)) {
                result.push(current);
            }
        } else {
            result.push(current);
        }
    }

    return result;
};

/**
 * Asynchronously retrieves the file changes required to apply a mod to the game directory.
 * @param mod - The name of the mod to be applied.
 * @param installDir - The directory where the game is installed.
 * @returns A promise that resolves to an array of file changes required to apply the mod.
 *
 * This function performs the following steps:
 * 1. Retrieves the file statistics for the specified mod directory.
 * 2. Checks if the mod directory exists and is a directory.
 * 3. Reads the directory structure of both the mod and the game installation.
 * 4. Compares the directory structures to determine the necessary file changes.
 *
 * If an error occurs while retrieving the file statistics or if the specified mod is not a directory,
 * an error message is logged to the console and an empty array is returned.
 */
export const getFileChangesToApplyMod = async (
    mod: string,
    installDir: string
): Promise<FileChange[]> => {
    let statsOfFile: fs.Stats | undefined;
    try {
        statsOfFile = fs.statSync(`${DEFAULT_MOD_DIR}\\${mod}`);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while getting the stats for the file ${`${DEFAULT_MOD_DIR}\\${mod}`}: ${err}`
        );
        return [];
    }

    if (statsOfFile) {
        if (!statsOfFile.isDirectory()) {
            console.error(
                `Error: ${`${DEFAULT_MOD_DIR}\\${mod}`} is not a directory.`
            );
            return [];
        }
        let modDirStructure;
        let gameDirStructure;
        let result;

        try {
            modDirStructure = readDirectory(`${DEFAULT_MOD_DIR}\\${mod}`);
        } catch (err) {
            console.error(
                `An error occurred while reading the mod directory ${`${DEFAULT_MOD_DIR}\\${mod}`}: ${err}`
            );
            return [];
        }

        try {
            gameDirStructure = readDirectory(installDir);
        } catch (err) {
            console.error(
                `An error occurred while reading the game directory ${installDir}: ${err}`
            );
            return [];
        }

        try {
            /*
            This compares the game's structure to the mod's structure. To extrapolate this into other
            mods, we need to compare the other mods to the game's structure as well and then use the line 
            changes to deduce incompatible files. This can be done with as many mods as we like...
            */
            result = diffDirectories({
                newDir: modDirStructure,
                oldDir: gameDirStructure,
            });
        } catch (err) {
            console.error(
                `An error occurred while diffing directories: ${err}`
            );
            return [];
        }

        return result;

        // Now we have the comparison ready, we need to apply the changes to the game directory
        // Before we do that, we need to save the changes we will do to a file so that we can go backwards later to un-apply the changes

        // console.log('result:', result);
    }
};
