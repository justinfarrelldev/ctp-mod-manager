// Utility constants and helpers for CTP1/CTP2 support

import path from 'path';

export const GAME_EXECUTABLES = ['ctp2.exe', 'civctp.exe'];
export const GAME_EXECUTABLES_UNIX = ['ctp2', 'civctp'];
export const GAME_PROGRAM_DIRS = ['ctp2_program', 'ctp_program'];
export const GAME_DATA_DIRS = ['ctp2_data', 'ctp_data'];

/**
 * Returns true if the file is a CTP executable (CTP1 or CTP2)
 * @param file The file name
 * @returns True if the file is a CTP executable
 */
export const isGameExecutable = (file: string): boolean => {
    return (
        GAME_EXECUTABLES.includes(file.toLowerCase()) ||
        GAME_EXECUTABLES_UNIX.includes(file.toLowerCase())
    );
};

/**
 * Returns true if the directory is a CTP program directory (CTP1 or CTP2)
 * @param dir The directory name
 * @returns True if the directory is a CTP program directory
 */
export const isGameProgramDir = (dir: string): boolean => {
    return GAME_PROGRAM_DIRS.includes(dir.toLowerCase());
};

/**
 * Returns true if the directory is a CTP data directory (CTP1 or CTP2)
 * @param dir The directory name
 * @returns True if the directory is a CTP data directory
 */
export const isGameDataDir = (dir: string): boolean => {
    return GAME_DATA_DIRS.includes(dir.toLowerCase());
};

/**
 * Returns all possible executable paths for both CTP1 and CTP2
 * @param installDir The installation directory
 * @param platform The platform string (default: process.platform)
 * @returns Array of possible executable paths
 */
export const getGameExecutablePath = (
    installDir: string,
    platform: string = process.platform
): string[] => {
    const paths: string[] = [];
    for (const programDir of GAME_PROGRAM_DIRS) {
        for (const exe of platform === 'win32'
            ? GAME_EXECUTABLES
            : GAME_EXECUTABLES_UNIX) {
            paths.push(path.join(installDir, programDir, 'ctp', exe));
        }
    }
    return paths;
};
