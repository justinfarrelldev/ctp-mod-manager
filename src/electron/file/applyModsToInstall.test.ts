import { describe, it, expect, vi, afterAll } from 'vitest';
import * as fs from 'fs';
import { applyModsToInstall } from './applyModsToInstall';
import { isValidInstall } from './isValidInstall';
import * as getFileChangesToApplyMod from './getFileChangesToApplyMod';
// import { DEFAULT_MOD_DIR } from '../constants';

vi.mock('fs');
vi.mock('./isValidInstall', () => ({
    isValidInstall: vi.fn(),
}));

vi.mock('electron', () => ({
    app: {
        getPath: vi.fn().mockReturnValue('/mock/path'),
        getName: vi.fn().mockReturnValue('mock-name'),
    },
}));

describe('applyModsToInstall', () => {
    afterAll(() => {
        vi.clearAllMocks();
    });

    it('should log an error if the install directory is invalid', () => {
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        vi.spyOn(fs, 'readdirSync').mockReturnValueOnce([]);

        applyModsToInstall('/invalid/install', ['mod1']);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Invalid install passed to applyModsToInstall! Install passed: /invalid/install'
        );
    });

    it('should log an error if a mod is not a directory', () => {
        vi.mocked(isValidInstall).mockResolvedValueOnce(true);
        vi.spyOn(fs, 'statSync').mockReturnValueOnce({
            isDirectory: () => false,
        } as fs.Stats);
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        applyModsToInstall('/valid/install', ['mod1']);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error: /mock/path\\mock-name\\Mods\\mod1 is not a directory.'
        );
    });

    it('should log an error if there is an issue getting the stats for a mod directory', async () => {
        vi.mocked(isValidInstall).mockResolvedValueOnce(true);
        vi.spyOn(fs, 'statSync').mockImplementationOnce(() => {
            throw new Error('stat error');
        });
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await applyModsToInstall('/valid/install', ['mod1']);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'An error occurred while getting the stats for the file /mock/path\\mock-name\\Mods\\mod1: Error: stat error'
        );
    });

    it('should log an error if there is an issue copying the mod directory', () => {
        vi.mocked(isValidInstall).mockResolvedValueOnce(true);
        vi.spyOn(fs, 'statSync').mockReturnValueOnce({
            isDirectory: () => true,
        } as fs.Stats);
        vi.spyOn(fs, 'cpSync').mockImplementationOnce(() => {
            throw new Error('copy error');
        });
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        applyModsToInstall('/valid/install', ['mod1']);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'An error occurred while copying the directory /mock/path\\mock-name\\Mods\\mod1 to /mock/path\\mock-name\\Mods: Error: copy error'
        );
    });

    it('should copy the mod directory and call getFileChangesToApplyMod if valid', async () => {
        // ensure the install directory is valid
        vi.mocked(isValidInstall).mockResolvedValueOnce(true);

        // mock/stub out the fs calls so that the tests don't interact with the real filesystem
        vi.spyOn(fs, 'statSync').mockReturnValueOnce({
            isDirectory: () => true,
        } as fs.Stats);

        // spy on cpSync so we can verify it is called
        const fsCpSyncSpy = vi
            .spyOn(fs, 'cpSync')
            .mockImplementationOnce(() => {});

        // mock getFileChangesToApplyMod itself
        // this ensures it doesn't actually read from disk or do real diffs
        const getFileChangesToApplyModMock = vi
            .spyOn(getFileChangesToApplyMod, 'getFileChangesToApplyMod')
            .mockResolvedValueOnce([]);

        // now run the function
        await applyModsToInstall('/valid/install', ['mod1']);

        // confirm that getFileChangesToApplyMod was called
        expect(getFileChangesToApplyModMock).toHaveBeenCalledWith(
            'mod1',
            '/valid/install'
        );
    });
});
