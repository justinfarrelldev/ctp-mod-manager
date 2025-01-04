// Applies the file changes that are passed to it

import { FileChange, TextFileChange } from './fileChange';

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

export const areFileChangesValid = ({
    modFileChanges,
}: {
    modFileChanges: ModFileChanges[];
}): boolean => {
    for (const change of modFileChanges) {
        // Validate that the file changes can be applied successfully
        const lineChangeGroups = change.fileChanges.map(
            (fc) => (fc as TextFileChange).lineChangeGroups
        );
        const allChanges = lineChangeGroups.flat();

        for (let i = 0; i < allChanges.length; i++) {
            for (let j = i + 1; j < allChanges.length; j++) {
                const changeA = allChanges[i];
                const changeB = allChanges[j];

                if (
                    (changeA.startLineNumber <= changeB.endLineNumber &&
                        changeA.endLineNumber >= changeB.startLineNumber) ||
                    (changeB.startLineNumber <= changeA.endLineNumber &&
                        changeB.endLineNumber >= changeA.startLineNumber)
                ) {
                    return false;
                }
            }
        }
    }

    return true;
};

export const applyFileChanges = async ({
    modFileChanges,
}: {
    modFileChanges: ModFileChanges[];
}): Promise<void> => {
    // First, we must validate that the file changes can be applied successfully
    // Additionally, once that step is done, we must back up the changes to a backup file so that they can be reversed in the future

    if (!areFileChangesValid({ modFileChanges })) {
        throw new ModsIncompatibleError(
            'The mods are incompatible with each other.'
        );
    }
};
