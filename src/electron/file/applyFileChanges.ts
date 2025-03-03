// Applies the file changes that are passed to it

import { FileChange, TextFileChange } from './fileChange';
import {
    LineChangeGroup,
    LineChangeGroupAdd,
    LineChangeGroupRemove,
    LineChangeGroupReplace,
} from './lineChangeGroup';
import * as fs from 'fs';

export type ModFileChanges = {
    mod: string;
    fileChanges: FileChange[];
};

export class ModsIncompatibleError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ModsIncompatibleError';
    }
}

export class ModApplicationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ModsApplicationError';
    }
}

/**
 * Checks if there are any conflicting line change groups within the provided file changes.
 *
 * A conflict occurs if any two line change groups overlap within the same file, meaning that
 * the start line number of one group is within the range of another group.
 *
 * @param fileChanges - An array of text file changes to check for conflicts.
 * @returns `true` if there are conflicting line change groups, otherwise `false`.
 */
export const textFileChangesAreConflicting = (
    fileChanges: TextFileChange[]
): boolean => {
    // Use a difference map per file to track changes with O(n + k log k) performance.
    // This approach is more efficient when processing millions of intervals.
    const fileDiffMap = new Map<string, Map<number, number>>();

    for (const { fileName, lineChangeGroups } of fileChanges) {
        if (!fileDiffMap.has(fileName)) {
            fileDiffMap.set(fileName, new Map<number, number>());
        }
        const diff = fileDiffMap.get(fileName)!;
        for (const group of lineChangeGroups) {
            // Increment at the start line.
            diff.set(
                group.startLineNumber,
                (diff.get(group.startLineNumber) || 0) + 1
            );
            // Decrement immediately after the end line.
            diff.set(
                group.endLineNumber + 1,
                (diff.get(group.endLineNumber + 1) || 0) - 1
            );
        }
    }

    for (const [fileName, diff] of fileDiffMap.entries()) {
        const sortedPositions = Array.from(diff.keys()).sort((a, b) => a - b);
        let activeIntervals = 0;
        for (const pos of sortedPositions) {
            activeIntervals += diff.get(pos)!;
            if (activeIntervals > 1) {
                // const originalFileChanges = fileChanges.filter(
                //     (change) => change.fileName === fileName
                // );
                // console.log(
                //     'Conflict found in file:',
                //     fileName,
                //     'with file changes:',
                //     JSON.stringify(originalFileChanges, null, 2)
                // );
                return true;
            }
        }
    }

    return false;
};

/**
 * Gets all conflicting line change groups.
 *
 * A conflict occurs if any two line change groups overlap, meaning that
 * the start line number of one group is within the range of another group.
 *
 * @param lineChangeGroups - An array of line change groups to check for conflicts.
 * @returns An array of arrays, where each inner array contains conflicting line change groups.
 */
const getAllConflictingLineChanges = (
    lineChangeGroups: LineChangeGroup[]
): LineChangeGroup[][] => {
    const conflicts: LineChangeGroup[][] = [];
    for (let i = 0; i < lineChangeGroups.length; i++) {
        for (let j = i + 1; j < lineChangeGroups.length; j++) {
            if (
                lineChangeGroups[i].startLineNumber <=
                    lineChangeGroups[j].endLineNumber &&
                lineChangeGroups[j].startLineNumber <=
                    lineChangeGroups[i].endLineNumber
            ) {
                conflicts.push([lineChangeGroups[i], lineChangeGroups[j]]);
            }
        }
    }
    return conflicts;
};

/**
 * Validates whether the provided file changes for all of the provided mods can be applied successfully without conflicts.
 *
 * @param {Object} params - The parameters object.
 * @param {ModFileChanges[]} params.modFileChanges - An array of file changes to be validated.
 * @returns {boolean} - Returns `true` if the file changes are valid and can be applied without conflicts, otherwise `false`.
 */

export const areFileChangesValid = ({
    modFileChanges,
}: {
    modFileChanges: ModFileChanges[];
}): boolean => {
    const uniqueMods = new Set(
        modFileChanges.map((modFileChange) => modFileChange.mod)
    );

    const allLineChangeGroups: TextFileChange[] = modFileChanges.flatMap(
        ({ fileChanges }) =>
            fileChanges.flatMap((fileChange) => fileChange as TextFileChange)
    );

    if (uniqueMods.size === 1) {
        if (textFileChangesAreConflicting(allLineChangeGroups)) {
            throw new ModApplicationError(
                'Conflicts detected within a single mod'
            );
        }
        return true;
    }

    if (modFileChanges.length === 1) {
        const { fileChanges } = modFileChanges[0];
        if (fileChanges === undefined) {
            // There is no "fileChanges" field on the modFileChanges object
            return false;
        }
        const lineChangeGroups: LineChangeGroup[] = fileChanges.flatMap(
            (fileChange) => (fileChange as TextFileChange).lineChangeGroups
        );

        const textFileChanges: TextFileChange[] = fileChanges.flatMap(
            (fileChange) => fileChange as TextFileChange
        );

        if (textFileChangesAreConflicting(textFileChanges)) {
            const conflictingChanges =
                getAllConflictingLineChanges(lineChangeGroups);
            throw new ModApplicationError(
                'The mod could not be applied due to conflicting line changes.'
            );
        }
    }

    if (modFileChanges === undefined) {
        throw new Error(
            `modFileChanges passed to areFileChangesValid were undefined!`
        );
    }

    return !textFileChangesAreConflicting(allLineChangeGroups);
};

export const applyFileChanges = ({
    modFileChanges,
    installDir,
}: {
    modFileChanges: ModFileChanges[];
    installDir: string;
}): void => {
    // First, we must validate that the file changes can be applied successfully
    // Additionally, once that step is done, we must back up the changes to a backup file so that they can be reversed in the future

    if (!areFileChangesValid({ modFileChanges })) {
        throw new ModsIncompatibleError(
            'The mods are incompatible with each other.'
        );
    }

    applyModFileChanges({ modFileChanges, installDir });
};

/**
 * Adds lines to a file at the specified line numbers.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.fileName - The name of the file to modify.
 * @param {LineChangeGroupAdd} params.lineChangeGroup - The line change group containing the lines to add.
 * @param {string[]} params.lines - The current content of the file as an array of lines.
 * @param {Map<number, number>} params.lineMap - A map of original line numbers to current line numbers.
 * @param {string} params.installDir - The directory where the files are installed.
 *
 * This function adds the lines specified in the line change group to the file.
 * If the specified lines exceed the current length of the file, the new lines are appended.
 * After adding the lines, the function updates the lineMap to reflect the changes.
 */
export const addLinesToFile = ({
    fileName,
    lineChangeGroup,
    lines,
    lineMap,
    installDir,
}: {
    fileName: string;
    lineChangeGroup: LineChangeGroupAdd;
    lines: string[];
    lineMap: Map<number, number>;
    installDir: string;
}): void => {
    const { startLineNumber, endLineNumber, newContent } = lineChangeGroup;

    // TODO WHEN I GET BACK ON
    // There is something that is making the first line of files not be written, I need to figure that out
    const newContentSplit = newContent.split('\n');

    if (endLineNumber > lines.length + 1) {
        lines.push(...newContentSplit);
    } else {
        lines.splice(startLineNumber - 1, 0, ...newContentSplit);
    }

    for (const [origLine, currLine] of lineMap.entries()) {
        if (currLine >= startLineNumber - 1) {
            lineMap.set(origLine, currLine + newContentSplit.length);
        }
    }

    console.log(
        `(add) Writing ${lines.length} lines to ${installDir + '\\' + fileName}`
    );
    fs.writeFileSync(installDir + '\\' + fileName, lines.join('\n'), 'utf-8');
};

/**
 * Removes lines from a file at the specified line numbers and updates the lineMap accordingly.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.fileName - The name of the file to modify.
 * @param {LineChangeGroupRemove} params.lineChangeGroup - The line change group containing the lines to remove.
 * @param {string[]} params.lines - The current content of the file as an array of lines.
 * @param {Map<number, number>} params.lineMap - A map of original line numbers to current line numbers.
 * @param {string} params.installDir - The directory where the files are installed.
 *
 * @throws {Error} If the start or end line number does not exist in the lineMap.
 *
 * This function removes the lines specified in the line change group from the file.
 * If the specified lines do not exist in the file, an error is thrown.
 * After removing the lines, the function updates the lineMap to reflect the changes.
 */
export const removeLinesFromFile = ({
    fileName,
    lineChangeGroup,
    lines,
    lineMap,
    installDir,
}: {
    fileName: string;
    lineChangeGroup: LineChangeGroupRemove;
    lines: string[];
    lineMap: Map<number, number>;
    installDir: string;
}): void => {
    // Just need to remove all the lines specified in the line change groups.
    // If there are lines that are removed from the end in the line change groups but that does
    // not exist in the lines, we throw an error.
    // If we remove lines, then we have to move up all of the lines in the line map that are below
    // the removed lines by the amount of lines that were removed.
    // For example, if there were the following lines:
    // 1. This is
    // 2. a
    // 3. test
    // 4. file
    // 5. test file
    //
    // ... then if we removed the lines 3-4, we would be left with this in the line map:
    //
    // 1. This is
    // 2. a
    // 3. test file

    // If the start or the end line number do not exist in the lineMap, throw
    if (!lineMap.get(lineChangeGroup.startLineNumber)) {
        console.error(
            `startLineNumber (${lineChangeGroup.startLineNumber}) does not exist in the lineMap. Line map: `,
            lineMap
        );
        throw new Error(
            `startLineNumber (${lineChangeGroup.startLineNumber}) does not exist in the lineMap.`
        );
    }

    if (!lineMap.get(lineChangeGroup.endLineNumber)) {
        throw new Error(
            `endLineNumber (${lineChangeGroup.endLineNumber}) does not exist in the lineMap`
        );
    }

    const { startLineNumber, endLineNumber } = lineChangeGroup;

    const numberOfLinesToRemove = endLineNumber - startLineNumber + 1;
    lines.splice(startLineNumber - 1, numberOfLinesToRemove);

    for (const [origLine, currLine] of lineMap.entries()) {
        if (currLine >= startLineNumber - 1) {
            if (
                currLine >= startLineNumber - 1 &&
                currLine <= endLineNumber - 1
            ) {
                lineMap.delete(origLine);
            } else if (currLine > endLineNumber - 1) {
                lineMap.set(origLine, currLine - numberOfLinesToRemove);
            }
        }
    }

    console.log(
        `(remove) Writing ${lines.length} lines to ${installDir + '\\' + fileName}`
    );
    fs.writeFileSync(installDir + '\\' + fileName, lines.join('\n'), 'utf-8');
};

/**
 * Replaces lines in a file at the specified line numbers with new content.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.fileName - The name of the file to modify.
 * @param {LineChangeGroupReplace} params.lineChangeGroup - The line change group containing the lines to replace.
 * @param {string[]} params.lines - The current content of the file as an array of lines.
 * @param {string} params.installDir - The directory where the files are installed.
 */
export const replaceLinesInFile = ({
    fileName,
    lineChangeGroup,
    lines,
    installDir,
}: {
    fileName: string;
    lineChangeGroup: LineChangeGroupReplace;
    lines: string[];
    installDir: string;
}): void => {
    const { startLineNumber, endLineNumber, newContent } = lineChangeGroup;

    if (startLineNumber <= lines.length && endLineNumber <= lines.length) {
        lines.splice(
            startLineNumber - 1,
            endLineNumber - startLineNumber + 1,
            newContent
        );
    }

    console.log(
        `(replace) Writing ${lines.length} lines to ${installDir + '\\' + fileName}`
    );
    fs.writeFileSync(installDir + '\\' + fileName, lines.join('\n'), 'utf-8');
};

/**
 * Applies modifications to files based on the provided mod file changes.
 *
 * This function iterates through each item in the `modFileChanges` array and processes
 * the line change groups within each file change. Depending on the type of change
 * (add, remove, replace), it will call the appropriate function to handle the modification.
 * If the file does not exist and the change is not a single 'add' operation, it throws an error.
 *
 * @param {Object} params - The parameters for the function.
 * @param {ModFileChanges[]} params.modFileChanges - An array of mod file changes to be applied.
 * @param {string} params.installDir - The directory where the files are installed.
 *
 * @typedef {Object} ModFileChanges - Represents the changes to be applied to a mod file.
 * @property {FileChange[]} fileChanges - An array of file changes.
 * @property {string} mod - The name or identifier of the mod.
 *
 * @typedef {Object} FileChange - Represents a change to a file.
 * @property {string} fileName - The name of the file to be changed.
 *
 * @typedef {Object} LineChangeGroup - Represents a group of line changes.
 * @property {string} changeType - The type of change ('add', 'remove', 'replace').
 * @property {number} startLineNumber - The starting line number for the change.
 * @property {number} endLineNumber - The ending line number for the change.
 * @property {string} newContent - The new content to be added or replaced.
 *
 * @typedef {Object} TextFileChange - Represents a text file change.
 * @property {LineChangeGroup[]} lineChangeGroups - An array of line change groups.
 */
export const applyModFileChanges = ({
    modFileChanges,
    installDir,
}: {
    modFileChanges: ModFileChanges[];
    installDir: string;
}): void => {
    for (const { fileChanges, mod } of modFileChanges) {
        for (const fileChange of fileChanges) {
            const textFileChange = fileChange as TextFileChange;

            if (!fs.existsSync(installDir + '\\' + fileChange.fileName)) {
                if (
                    textFileChange.lineChangeGroups.length !== 1 ||
                    textFileChange.lineChangeGroups[0].changeType !== 'add'
                ) {
                    throw new ModApplicationError(
                        `File ${fileChange.fileName} does not exist and the change is not a single 'add' operation.`
                    );
                }

                const lines: string[] = [];
                // Key is original line number, value is current line number (adjusted for additions, removals)
                const lineMap = new Map<number, number>(
                    lines.map((_, index) => [index, index])
                );
                for (const lineChangeGroup of textFileChange.lineChangeGroups) {
                    try {
                        addLinesToFile({
                            fileName: fileChange.fileName,
                            lineChangeGroup:
                                lineChangeGroup as LineChangeGroupAdd,
                            lines,
                            lineMap,
                            installDir,
                        });
                    } catch (error) {
                        throw new ModApplicationError(
                            `Failed to add lines to file ${fileChange.fileName}: ${error.message}`
                        );
                    }
                }
            } else {
                const fileData: string = fs.readFileSync(
                    installDir + '\\' + fileChange.fileName,
                    'utf-8'
                );
                const lines: string[] = fileData.split('\n');
                // Key is original line number, value is current line number (adjusted for additions, removals)
                const lineMap = new Map<number, number>(
                    lines.map((_, index) => [index + 1, index + 1])
                );

                for (const lineChangeGroup of textFileChange.lineChangeGroups) {
                    switch (lineChangeGroup.changeType) {
                        case 'add':
                            try {
                                addLinesToFile({
                                    fileName: fileChange.fileName,
                                    lineChangeGroup:
                                        lineChangeGroup as LineChangeGroupAdd,
                                    lines,
                                    lineMap,
                                    installDir,
                                });
                            } catch (error) {
                                throw new ModApplicationError(
                                    `Failed to add lines to file ${fileChange.fileName}: ${error.message}`
                                );
                            }

                            break;
                        case 'remove':
                            try {
                                removeLinesFromFile({
                                    fileName: fileChange.fileName,
                                    lineChangeGroup,
                                    lines,
                                    lineMap,
                                    installDir,
                                });
                            } catch (error) {
                                throw new ModApplicationError(
                                    `Failed to remove lines from file ${fileChange.fileName}: ${error.message}`
                                );
                            }
                            break;
                        case 'replace':
                            try {
                                replaceLinesInFile({
                                    fileName: fileChange.fileName,
                                    lineChangeGroup:
                                        lineChangeGroup as LineChangeGroupReplace,
                                    lines,
                                    installDir,
                                });
                            } catch (error) {
                                throw new ModApplicationError(
                                    `Failed to replace lines in file ${fileChange.fileName}: ${error.message}`
                                );
                            }
                            break;
                    }
                }

                // fs.writeFileSync(
                //     installDir + '\\' + fileChange.fileName,
                //     lines.join('\n'),
                //     'utf-8'
                // );
            }
        }
    }
};
