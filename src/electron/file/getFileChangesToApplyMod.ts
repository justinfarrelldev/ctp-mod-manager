import { DEFAULT_MOD_DIR } from '../constants';
import fs from 'node:fs';
import { diffLines, Change } from 'diff';
import { diffDirectories } from './diffDirectories';
import { readDirectory } from './readDirectory';
import { FileChange } from './fileChange';
import {
    LineChangeGroup,
    LineChangeGroupRemove,
    LineChangeGroupAdd,
} from './lineChangeGroup';

/**
 * Computes the differences between two texts using the Diff Match Patch library.
 *
 * @param text1 - The first text to compare.
 * @param text2 - The second text to compare.
 * @returns An array of differences, where each difference is represented as an
 *          object with a `0` (equal), `-1` (delete), or `1` (insert) operation
 *          and the associated text.
 */
export const diffTexts = (text1: string, text2: string): Change[] => {
    const diffs = diffLines(text1, text2, {
        newlineIsToken: true,
    });

    return diffs;
};

/**
 * Consolidates line change groups by merging matching remove/add pairs into replace operations.
 *
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
    groups: LineChangeGroup[]
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
                            startLineNumber: current.startLineNumber,
                            endLineNumber: current.endLineNumber,
                            oldContent: (current as LineChangeGroupRemove)
                                .oldContent,
                            newContent: (next as LineChangeGroupAdd).newContent,
                        });
                    } else if (
                        current.changeType === 'add' &&
                        next.changeType === 'remove'
                    ) {
                        result.push({
                            changeType: 'replace',
                            startLineNumber: current.startLineNumber,
                            endLineNumber: current.endLineNumber,
                            oldContent: (next as LineChangeGroupRemove)
                                .oldContent,
                            newContent: (current as LineChangeGroupAdd)
                                .newContent,
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
    }

    if (statsOfFile) {
        if (!statsOfFile.isDirectory()) {
            console.error(
                `Error: ${`${DEFAULT_MOD_DIR}\\${mod}`} is not a directory.`
            );
            return [];
        }

        const modDirStructure = readDirectory(`${DEFAULT_MOD_DIR}\\${mod}`);

        const gameDirStructure = readDirectory(installDir);

        /*
            This compares the game's structure to the mod's structure. To extrapolate this into other
            mods, we need to compare the other mods to the game's structure as well and then use the line 
            changes to deduce incompatible files. This can be done with as many mods as we like...
        */
        const result = diffDirectories({
            oldDir: gameDirStructure,
            newDir: modDirStructure,
        });

        result.forEach((fileChange) => {
            if (
                'lineChangeGroups' in fileChange &&
                fileChange.lineChangeGroups
            ) {
                fileChange.lineChangeGroups = consolidateLineChangeGroups(
                    fileChange.lineChangeGroups
                );
            }
        });

        return result;

        // Now we have the comparison ready, we need to apply the changes to the game directory
        // Before we do that, we need to save the changes we will do to a file so that we can go backwards later to un-apply the changes

        // console.log('result:', result);
    }
};
