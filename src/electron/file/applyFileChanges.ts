// Applies the file changes that are passed to it

import { FileChange, TextFileChange } from './fileChange';
import { LineChangeGroup } from './lineChangeGroup';

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

const applyModFileChanges = ({
    modFileChanges,
}: {
    modFileChanges: ModFileChanges[];
}): void => {
    for (const { fileChanges, mod } of modFileChanges) {
        console.log('Applying mod: ', mod);
        for (const fileChange of fileChanges) {
            const textFileChange = fileChange as TextFileChange;
            for (const lineChangeGroup of textFileChange.lineChangeGroups) {
                switch (lineChangeGroup.changeType) {
                    case 'add':
                        // Call function to handle line additions
                        // addLinesToFile(lineChangeGroup);
                        break;
                    case 'remove':
                        // Call function to handle line removals
                        // removeLinesFromFile(lineChangeGroup);
                        break;
                    case 'replace':
                        // Call function to handle line replacements
                        // replaceLinesInFile(lineChangeGroup);
                        break;
                }
            }
        }
    }
};
