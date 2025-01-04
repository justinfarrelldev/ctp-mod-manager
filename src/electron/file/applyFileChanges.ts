// Applies the file changes that are passed to it

import { FileChange, TextFileChange } from './fileChange';
import { LineChangeGroup } from './lineChangeGroup';

type ModFileChanges = {
    mod: string;
    fileChanges: FileChange[];
};

class ModsIncompatibleError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ModsIncompatibleError';
    }
}

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
    const allLineChangeGroups: LineChangeGroup[] = [];

    for (const { fileChanges } of modFileChanges) {
        for (const fileChange of fileChanges) {
            allLineChangeGroups.push(
                ...(fileChange as TextFileChange).lineChangeGroups
            );
        }
    }

    for (let i = 0; i < allLineChangeGroups.length; i++) {
        for (let j = i + 1; j < allLineChangeGroups.length; j++) {
            if (
                allLineChangeGroups[i].startLineNumber <=
                    allLineChangeGroups[j].endLineNumber &&
                allLineChangeGroups[j].startLineNumber <=
                    allLineChangeGroups[i].endLineNumber
            ) {
                return false;
            }
        }
    }

    return true;
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
};
