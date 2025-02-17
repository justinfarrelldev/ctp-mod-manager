// Applies the file changes that are passed to it

import { FileChange, TextFileChange } from './fileChange';
import {
    LineChangeGroup,
    LineChangeGroupAdd,
    LineChangeGroupRemove,
    LineChangeGroupReplace,
} from './lineChangeGroup';
import * as fs from 'fs';

type ModFileChanges = {
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
 * Checks if there are any conflicting line change groups.
 *
 * A conflict occurs if any two line change groups overlap, meaning that
 * the start line number of one group is within the range of another group.
 *
 * @param lineChangeGroups - An array of line change groups to check for conflicts.
 * @returns `true` if there are conflicting line change groups, otherwise `false`.
 */
const lineChangesAreConflicting = (
    lineChangeGroups: LineChangeGroup[]
): boolean => {
    for (let i = 0; i < lineChangeGroups.length; i++) {
        for (let j = i + 1; j < lineChangeGroups.length; j++) {
            if (
                lineChangeGroups[i].startLineNumber <=
                    lineChangeGroups[j].endLineNumber &&
                lineChangeGroups[j].startLineNumber <=
                    lineChangeGroups[i].endLineNumber
            ) {
                return true;
            }
        }
    }
    return false;
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
    if (modFileChanges.length === 1) {
        const { fileChanges } = modFileChanges[0];
        const lineChangeGroups: LineChangeGroup[] = fileChanges.flatMap(
            (fileChange) => (fileChange as TextFileChange).lineChangeGroups
        );

        if (lineChangesAreConflicting(lineChangeGroups)) {
            throw new ModApplicationError(
                'The mod could not be applied due to an error.'
            );
        }
    }

    const allLineChangeGroups: LineChangeGroup[] = modFileChanges.flatMap(
        ({ fileChanges }) =>
            fileChanges.flatMap(
                (fileChange) => (fileChange as TextFileChange).lineChangeGroups
            )
    );

    return !lineChangesAreConflicting(allLineChangeGroups);
};

export const applyFileChanges = ({
    modFileChanges,
}: {
    modFileChanges: ModFileChanges[];
}): void => {
    // First, we must validate that the file changes can be applied successfully
    // Additionally, once that step is done, we must back up the changes to a backup file so that they can be reversed in the future

    if (!areFileChangesValid({ modFileChanges })) {
        throw new ModsIncompatibleError(
            'The mods are incompatible with each other.'
        );
    }

    applyModFileChanges({ modFileChanges });
};

/**
 * Adds lines to a file at the specified line numbers.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.fileName - The name of the file to modify.
 * @param {LineChangeGroupAdd} params.lineChangeGroup - The line change group containing the lines to add.
 * @param {string[]} params.lines - The current content of the file as an array of lines.
 * @param {Map<number, number>} params.lineMap - A map of original line numbers to current line numbers.
 */
export const addLinesToFile = ({
    fileName,
    lineChangeGroup,
    lines,
    lineMap,
}: {
    fileName: string;
    lineChangeGroup: LineChangeGroupAdd;
    lines: string[];
    lineMap: Map<number, number>;
}): void => {
    const { startLineNumber, endLineNumber, newContent } = lineChangeGroup;
    const newContentSplit = newContent.split('\n');

    if (endLineNumber > lines.length) {
        lines.push(...newContentSplit);
    } else {
        lines.splice(startLineNumber, 0, ...newContentSplit);
    }

    for (const [origLine, currLine] of lineMap.entries()) {
        if (currLine >= startLineNumber - 1) {
            lineMap.set(origLine, currLine + newContentSplit.length);
        }
    }

    fs.writeFileSync(fileName, lines.join('\n'), 'utf-8');
};

/**
 * Removes lines from a file at the specified line numbers and updates the lineMap accordingly.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.fileName - The name of the file to modify.
 * @param {LineChangeGroupRemove} params.lineChangeGroup - The line change group containing the lines to remove.
 * @param {string[]} params.lines - The current content of the file as an array of lines.
 * @param {Map<number, number>} params.lineMap - A map of original line numbers to current line numbers.
 */
export const removeLinesFromFile = ({
    fileName,
    lineChangeGroup,
    lines,
    lineMap,
}: {
    fileName: string;
    lineChangeGroup: LineChangeGroupRemove;
    lines: string[];
    lineMap: Map<number, number>;
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
        throw new Error(
            `startLineNumber (${lineChangeGroup.startLineNumber}) does not exist in the lineMap`
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

    fs.writeFileSync(fileName, lines.join('\n'), 'utf-8');
};

/**
 * Replaces lines in a file at the specified line numbers with new content.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.fileName - The name of the file to modify.
 * @param {LineChangeGroupReplace} params.lineChangeGroup - The line change group containing the lines to replace.
 * @param {string[]} params.lines - The current content of the file as an array of lines.
 * @param {Map<number, number>} params.lineMap - A map of original line numbers to current line numbers.
 */
export const replaceLinesInFile = ({
    fileName,
    lineChangeGroup,
    lines,
    lineMap,
}: {
    fileName: string;
    lineChangeGroup: LineChangeGroupReplace;
    lines: string[];
    lineMap: Map<number, number>;
}): void => {
    const { startLineNumber, endLineNumber, newContent } = lineChangeGroup;

    if (startLineNumber <= lines.length && endLineNumber <= lines.length) {
        lines.splice(
            startLineNumber - 1,
            endLineNumber - startLineNumber + 1,
            newContent
        );
    }

    fs.writeFileSync(fileName, lines.join('\n'), 'utf-8');
};

/**
 * Applies modifications to files based on the provided mod file changes.
 *
 * This function iterates through each item in the `modFileChanges` array and processes
 * the line change groups within each file change. Depending on the type of change
 * (add, remove, replace), it will call the appropriate function to handle the modification.
 *
 * @param {Object} params - The parameters for the function.
 * @param {ModFileChanges[]} params.modFileChanges - An array of mod file changes to be applied.
 *
 * @typedef {Object} ModFileChanges - Represents the changes to be applied to a mod file.
 * @property {FileChange[]} fileChanges - An array of file changes.
 * @property {string} mod - The name or identifier of the mod.
 *
 * @typedef {Object} FileChange - Represents a change to a file.
 * @property {LineChangeGroup[]} lineChangeGroups - An array of line change groups.
 *
 * @typedef {Object} LineChangeGroup - Represents a group of line changes.
 * @property {string} changeType - The type of change ('add', 'remove', 'replace').
 *
 * @typedef {Object} TextFileChange - Represents a text file change.
 * @property {LineChangeGroup[]} lineChangeGroups - An array of line change groups.
 */
export const applyModFileChanges = ({
    modFileChanges,
}: {
    modFileChanges: ModFileChanges[];
}): void => {
    for (const { fileChanges, mod } of modFileChanges) {
        console.log('Applying mod: ', mod);
        for (const fileChange of fileChanges) {
            const textFileChange = fileChange as TextFileChange;
            const fileData: string = fs.readFileSync(
                fileChange.fileName,
                'utf-8'
            );
            const lines: string[] = fileData.split('\n');
            // Key is original line number, value is current line number (adjusted for additions, removals)
            const lineMap = new Map<number, number>(
                lines.map((_, index) => [index, index])
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
                                lineMap,
                            });
                        } catch (error) {
                            throw new ModApplicationError(
                                `Failed to replace lines in file ${fileChange.fileName}: ${error.message}`
                            );
                        }
                        break;
                }
            }
        }
    }
};
