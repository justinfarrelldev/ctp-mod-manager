/* eslint-disable @typescript-eslint/no-empty-function */
import * as fs from 'fs';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import * as applyFileChanges from './applyFileChanges';
import { applyModsToInstallWithMerge } from './applyModsToInstall';
import * as getFileChangesToApplyMod from './getFileChangesToApplyMod';
import { isValidInstall } from './isValidInstall';
import { LineChangeGroup } from './lineChangeGroup';
// import { DEFAULT_MOD_DIR } from '../constants';

vi.mock('fs');
vi.mock('./isValidInstall', () => ({
    isValidInstall: vi.fn(),
}));

vi.mock('electron', () => ({
    app: {
        getName: vi.fn().mockReturnValue('mock-name'),
        getPath: vi.fn().mockReturnValue('/mock/path'),
    },
}));

describe('applyModsToInstall', () => {
    afterAll(() => {
        vi.clearAllMocks();
    });

    it('should log an error if the install directory is invalid', async () => {
        expect.assertions(1);
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        vi.spyOn(fs, 'readdirSync').mockReturnValueOnce([]);

        await applyModsToInstallWithMerge('/invalid/install', ['mod1']);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Invalid install passed to applyModsToInstall! Install passed: /invalid/install'
        );
    });
    it('should log an error if a mod is not a directory', async () => {
        expect.assertions(1);
        vi.mocked(isValidInstall).mockResolvedValueOnce(true);
        vi.spyOn(fs, 'statSync').mockReturnValueOnce({
            isDirectory: () => false,
        } as fs.Stats);
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await applyModsToInstallWithMerge('/valid/install', ['mod1']);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('is not a directory')
        );
    });

    it('should log an error if there is an issue getting the stats for a mod directory', async () => {
        expect.assertions(1);
        vi.mocked(isValidInstall).mockResolvedValueOnce(true);
        vi.spyOn(fs, 'statSync').mockImplementationOnce(() => {
            throw new Error('stat error');
        });
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await applyModsToInstallWithMerge('/valid/install', ['mod1']);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('An error occurred while getting the stats')
        );
    });

    it('should log an error if getFileChangesToApplyMod throws an error', async () => {
        expect.assertions(2);
        vi.mocked(isValidInstall).mockResolvedValueOnce(true);
        vi.spyOn(fs, 'statSync').mockReturnValueOnce({
            isDirectory: () => true,
        } as fs.Stats);
        const getFileChangesToApplyModMock = vi
            .spyOn(getFileChangesToApplyMod, 'getFileChangesToApplyMod')
            .mockRejectedValueOnce(new Error('getFileChangesToApplyMod error'));
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await applyModsToInstallWithMerge('/valid/install', ['mod1']);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                'An error occurred within applying mods to install'
            )
        );
        expect(getFileChangesToApplyModMock).toHaveBeenCalledWith(
            'mod1',
            '/valid/install'
        );
    });

    it('should copy the mod directory and call getFileChangesToApplyMod if valid', async () => {
        expect.assertions(1);
        // ensure the install directory is valid
        vi.mocked(isValidInstall).mockResolvedValueOnce(true);

        // mock/stub out the fs calls so that the tests don't interact with the real filesystem
        vi.spyOn(fs, 'statSync').mockReturnValueOnce({
            isDirectory: () => true,
        } as fs.Stats);

        // mock getFileChangesToApplyMod itself
        // this ensures it doesn't actually read from disk or do real diffs
        const getFileChangesToApplyModMock = vi
            .spyOn(getFileChangesToApplyMod, 'getFileChangesToApplyMod')
            .mockResolvedValueOnce([]);

        // now run the function
        await applyModsToInstallWithMerge('/valid/install', ['mod1']);

        // confirm that getFileChangesToApplyMod was called
        expect(getFileChangesToApplyModMock).toHaveBeenCalledWith(
            'mod1',
            '/valid/install'
        );
    });
});
vi.mock('fs');
vi.mock('./isValidInstall', () => ({
    isValidInstall: vi.fn(),
}));
vi.mock('./applyFileChanges', () => ({
    applyFileChanges: vi.fn(),
}));
vi.mock('./getFileChangesToApplyMod', () => ({
    consolidateLineChangeGroups: vi.fn((x) => x),
    getFileChangesToApplyMod: vi.fn(),
}));

vi.mock('electron', () => ({
    app: {
        getName: vi.fn().mockReturnValue('mock-name'),
        getPath: vi.fn().mockReturnValue('/mock/path'),
    },
}));

describe('applyModsToInstall', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterAll(() => {
        vi.clearAllMocks();
    });

    it('should log an error if the install directory is invalid', async () => {
        expect.assertions(2);
        vi.mocked(isValidInstall).mockResolvedValue(false);

        await applyModsToInstallWithMerge('/invalid/install', ['mod1']);

        expect(console.error).toHaveBeenCalledWith(
            'Invalid install passed to applyModsToInstall! Install passed: /invalid/install'
        );
        expect(
            getFileChangesToApplyMod.getFileChangesToApplyMod
        ).not.toHaveBeenCalled();
    });

    it('should log an error if a mod is not a directory', async () => {
        expect.assertions(1);
        vi.mocked(isValidInstall).mockResolvedValue(true);
        vi.spyOn(fs, 'statSync').mockReturnValueOnce({
            isDirectory: () => false,
        } as fs.Stats);

        await applyModsToInstallWithMerge('/valid/install', ['mod1']);

        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('is not a directory')
        );
    });

    it('should log an error if there is an issue getting the stats for a mod directory', async () => {
        expect.assertions(1);
        vi.mocked(isValidInstall).mockResolvedValue(true);
        vi.spyOn(fs, 'statSync').mockImplementationOnce(() => {
            throw new Error('stat error');
        });

        await applyModsToInstallWithMerge('/valid/install', ['mod1']);

        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('An error occurred while getting the stats')
        );
    });

    it('should apply changes for a single mod (Case 1: property replacement)', async () => {
        expect.assertions(2);
        vi.mocked(isValidInstall).mockResolvedValue(true);
        vi.spyOn(fs, 'statSync').mockReturnValue({
            isDirectory: () => true,
        } as fs.Stats);

        const mockChanges = [
            {
                fileName: 'test.ts',
                lineChangeGroups: [
                    {
                        changeType: 'replace' as const,
                        endLineNumber: 6,
                        newContent: '            magicka: number;',
                        oldContent: '',
                        startLineNumber: 4,
                    },
                ],
            },
        ];

        vi.mocked(
            getFileChangesToApplyMod.getFileChangesToApplyMod
        ).mockResolvedValueOnce(mockChanges);

        await applyModsToInstallWithMerge('/valid/install', ['mod1']);

        expect(
            getFileChangesToApplyMod.getFileChangesToApplyMod
        ).toHaveBeenCalledWith('mod1', '/valid/install');
        expect(applyFileChanges.applyFileChanges).toHaveBeenCalledWith({
            installDir: '/valid/install',
            modFileChanges: [
                {
                    fileChanges: mockChanges,
                    mod: 'mod1',
                },
            ],
        });
    });

    it('should apply changes for a single mod (Case 2: property reordering)', async () => {
        expect.assertions(1);
        vi.mocked(isValidInstall).mockResolvedValue(true);
        vi.spyOn(fs, 'statSync').mockReturnValue({
            isDirectory: () => true,
        } as fs.Stats);

        const mockChanges = [
            {
                fileName: 'test.ts',
                lineChangeGroups: [
                    {
                        changeType: 'replace' as const,
                        endLineNumber: 5,
                        newContent:
                            '            happiness: number;\n            health: number;\n            stamina: number;',
                        oldContent: '',
                        startLineNumber: 2,
                    },
                ],
            },
        ];

        vi.mocked(
            getFileChangesToApplyMod.getFileChangesToApplyMod
        ).mockResolvedValueOnce(mockChanges);

        await applyModsToInstallWithMerge('/valid/install', ['mod1']);

        expect(applyFileChanges.applyFileChanges).toHaveBeenCalledWith({
            installDir: '/valid/install',
            modFileChanges: [
                {
                    fileChanges: mockChanges,
                    mod: 'mod1',
                },
            ],
        });
    });

    it('should apply changes for a single mod (Case 3: property replacement with similar name)', async () => {
        expect.assertions(1);
        vi.mocked(isValidInstall).mockResolvedValue(true);
        vi.spyOn(fs, 'statSync').mockReturnValue({
            isDirectory: () => true,
        } as fs.Stats);

        const mockChanges = [
            {
                fileName: 'test.ts',
                lineChangeGroups: [
                    {
                        changeType: 'replace' as const,
                        endLineNumber: 4,
                        newContent: '            happiness: number;',
                        oldContent: '',
                        startLineNumber: 4,
                    },
                ],
            },
        ];

        vi.mocked(
            getFileChangesToApplyMod.getFileChangesToApplyMod
        ).mockResolvedValueOnce(mockChanges);

        await applyModsToInstallWithMerge('/valid/install', ['mod1']);

        expect(applyFileChanges.applyFileChanges).toHaveBeenCalledWith({
            installDir: '/valid/install',
            modFileChanges: [
                {
                    fileChanges: mockChanges,
                    mod: 'mod1',
                },
            ],
        });
    });

    it('should apply changes for a single mod (Case 4: multiple changes with reordering)', async () => {
        expect.assertions(1);
        vi.mocked(isValidInstall).mockResolvedValue(true);
        vi.spyOn(fs, 'statSync').mockReturnValue({
            isDirectory: () => true,
        } as fs.Stats);

        const mockChanges = [
            {
                fileName: 'test.ts',
                lineChangeGroups: [
                    {
                        changeType: 'replace' as const,
                        endLineNumber: 13,
                        newContent:
                            "interface TestInterface {\n            health: number;\n            isInvulnerable: true;\n            stamina: number;\n            customChar: 'Dave';\n            happiness: number;\n\n        }\n\n        function IsCool() {\n            return true;\n        }",
                        oldContent: '',
                        startLineNumber: 1,
                    },
                ],
            },
        ];

        vi.mocked(
            getFileChangesToApplyMod.getFileChangesToApplyMod
        ).mockResolvedValueOnce(mockChanges);

        await applyModsToInstallWithMerge('/valid/install', ['mod1']);

        expect(applyFileChanges.applyFileChanges).toHaveBeenCalledWith({
            installDir: '/valid/install',
            modFileChanges: [
                {
                    fileChanges: mockChanges,
                    mod: 'mod1',
                },
            ],
        });
    });

    it('should apply changes for multiple mods sequentially (Case 5)', async () => {
        expect.assertions(4);
        vi.mocked(isValidInstall).mockResolvedValue(true);
        vi.spyOn(fs, 'statSync').mockReturnValue({
            isDirectory: () => true,
        } as fs.Stats);

        const mockChanges1 = [
            {
                fileName: 'test.ts',
                lineChangeGroups: [
                    {
                        changeType: 'replace' as const,
                        endLineNumber: 15,
                        newContent:
                            "interface TestInterface {\n            health: number;\n            isInvulnerable: true;\n            stamina: number;\n            customChar: 'Dave';\n            happiness: number;\n\n        }\n\n        function IsCool() {\n            return true;\n        }",
                        oldContent: '',
                        startLineNumber: 1,
                    },
                ],
            },
        ];

        const mockChanges2 = [
            {
                fileName: 'test.ts',
                lineChangeGroups: [
                    {
                        changeType: 'replace' as const,
                        endLineNumber: 5,
                        newContent: '            IsReallyCool: true;',
                        oldContent: '',
                        startLineNumber: 5,
                    },
                ],
            },
        ];

        vi.mocked(getFileChangesToApplyMod.getFileChangesToApplyMod)
            .mockResolvedValueOnce(mockChanges1)
            .mockResolvedValueOnce(mockChanges2);

        vi.mocked(
            getFileChangesToApplyMod.consolidateLineChangeGroups
        ).mockImplementation((groups) => {
            return groups as unknown as LineChangeGroup[];
        });

        await applyModsToInstallWithMerge('/valid/install', ['mod1', 'mod2']);

        expect(
            getFileChangesToApplyMod.getFileChangesToApplyMod
        ).toHaveBeenCalledTimes(2);
        expect(
            getFileChangesToApplyMod.getFileChangesToApplyMod
        ).toHaveBeenNthCalledWith(1, 'mod1', '/valid/install');
        expect(
            getFileChangesToApplyMod.getFileChangesToApplyMod
        ).toHaveBeenNthCalledWith(2, 'mod2', '/valid/install');

        // The most important part is that applyFileChanges gets called with both mod changes
        expect(applyFileChanges.applyFileChanges).toHaveBeenCalledWith({
            installDir: '/valid/install',
            modFileChanges: expect.arrayContaining([
                expect.objectContaining({ mod: 'mod1' }),
                expect.objectContaining({ mod: 'mod2' }),
            ]),
        });
    });
});
