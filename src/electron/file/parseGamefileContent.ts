/**
 * A gamefile refers to any file in a mod ending in 'gamefile.txt'. These files are used in the Modswapper program
 * to apply various mods and contain information about the mod being applied. They are NOT referring to game asset files.
 */

/**
 * Extracts specific mod information from gamefile content by reading specific lines.
 * These lines contain information about the mod files that need to be swapped by Modswapper.
 * @param content - The content of a gamefile.txt file as a string
 * @param gamefilePath - The path to the gamefile for resolving relative paths
 * @returns An object containing extracted mod information from specified lines
 */
export const parseGamefileContent = (
    content: string,
    gamefilePath?: string
): {
    gamefilePath?: string;
    greatLibraryName: null | string;
    ldlStrName: null | string;
    modName: null | string;
    newspriteName: null | string;
    tipsStrName: null | string;
} => {
    const lines = content.split('\n');

    return {
        gamefilePath,
        greatLibraryName: lines.length >= 68 ? lines[67].trim() : null, // corresponds to Great_Library.txt
        ldlStrName: lines.length >= 70 ? lines[69].trim() : null, // corresponds to ldl_str.txt
        modName: lines.length >= 66 ? lines[65].trim() : null, // name of the mod, shows up in ModSwap like this
        newspriteName: lines.length >= 67 ? lines[66].trim() : null, // corresponds to newsprite.txt
        tipsStrName: lines.length >= 69 ? lines[68].trim() : null, // corresponds to tips_str.txt
    };
};
