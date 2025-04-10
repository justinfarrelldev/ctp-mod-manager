/**
 * A gamefile refers to any file in a mod ending in 'gamefile.txt'. These files are used in the Modswapper program
 * to apply various mods and contain information about the mod being applied. They are NOT referring to game asset files.
 */

/**
 * Extracts specific mod information from gamefile content by reading specific lines.
 * These lines contain information about the mod files that need to be swapped by Modswapper.
 * @param content - The content of a gamefile.txt file as a string
 * @returns An object containing extracted mod information from specified lines
 */
export const parseGamefileContent = (
    content: string
): {
    greatLibraryName: null | string;
    ldlStrName: null | string;
    modName: null | string;
    newspriteName: null | string;
    tipsStrName: null | string;
} => {
    const lines = content.split('\n');

    return {
        greatLibraryName: lines.length >= 68 ? lines[67].trim() : null,
        ldlStrName: lines.length >= 70 ? lines[69].trim() : null,
        modName: lines.length >= 66 ? lines[65].trim() : null,
        newspriteName: lines.length >= 67 ? lines[66].trim() : null,
        tipsStrName: lines.length >= 69 ? lines[68].trim() : null,
    };
};
