const SPECIAL_FILE_EXTENSIONS: string[] = [
    '.tga',
    '.til',
    '.pdf',
    '.spr',
    '.zfs',
    '.tif',
    '.db',
    '.ico',
    '.c2g',
    '.scc',
    '.htm',
    '.html',
    '.rtf',
    '.jpg',
    '.gif',
    '.dll',
    '.ogg',
    '.exe',
];

/**
 * Checks if the given file path has a special file extension (.tga, .til, .pdf, etc.).
 * @param filePath - The path of the file to check.
 * @returns `true` if the file has a special extension, otherwise `false`.
 */
export const isBinaryFile = (filePath: string): boolean => {
    const lowerCasePath = filePath.toLowerCase();
    return SPECIAL_FILE_EXTENSIONS.some((ext) => lowerCasePath.endsWith(ext));
};
