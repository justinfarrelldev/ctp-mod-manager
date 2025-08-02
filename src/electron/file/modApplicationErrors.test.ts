import * as fs from 'fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyModsToInstall } from './applyModsToInstall';
import { isValidInstall } from './isValidInstall';

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

describe('mod application error handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {
            // Mock implementation
        });
        vi.spyOn(console, 'error').mockImplementation(() => {
            // Mock implementation
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('permission error propagation (Bug #2)', () => {
        it('should throw ModApplicationError with detailed message for permission errors in Program Files', async () => {
            expect.assertions(1);

            vi.mocked(isValidInstall).mockResolvedValue(true);
            vi.spyOn(fs, 'statSync').mockReturnValue({
                isDirectory: () => true,
            } as fs.Stats);

            const mockError = new Error('EPERM: operation not permitted');
            vi.spyOn(fs, 'cpSync').mockImplementation(() => {
                throw mockError;
            });

            await expect(
                applyModsToInstall('C:\\Program Files\\CallToPower2', [
                    'testMod',
                ])
            ).rejects.toThrow(
                'Permission denied: Cannot write to "C:\\Program Files\\CallToPower2"'
            );
        });

        it('should throw ModApplicationError with general message for permission errors in other locations', async () => {
            expect.assertions(1);

            vi.mocked(isValidInstall).mockResolvedValue(true);
            vi.spyOn(fs, 'statSync').mockReturnValue({
                isDirectory: () => true,
            } as fs.Stats);

            const mockError = new Error('EPERM: operation not permitted');
            vi.spyOn(fs, 'cpSync').mockImplementation(() => {
                throw mockError;
            });

            await expect(
                applyModsToInstall('C:\\Games\\CallToPower2', ['testMod'])
            ).rejects.toThrow(
                'Permission denied: Cannot write to "C:\\Games\\CallToPower2"'
            );
        });

        it('should throw ModApplicationError for tracking file permission errors', async () => {
            expect.assertions(1);

            vi.mocked(isValidInstall).mockResolvedValue(true);
            vi.spyOn(fs, 'statSync').mockReturnValue({
                isDirectory: () => true,
            } as fs.Stats);
            vi.spyOn(fs, 'cpSync').mockImplementation(() => {
                // File copy succeeds
            });
            vi.spyOn(fs, 'existsSync').mockReturnValue(false);

            const mockError = new Error('EPERM: operation not permitted');
            vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
                throw mockError;
            });

            await expect(
                applyModsToInstall('C:\\Program Files\\CallToPower2', [
                    'testMod',
                ])
            ).rejects.toThrow(
                'Permission denied: Cannot write mods tracking file'
            );
        });
    });

    describe('concurrent operation handling (Bug #3)', () => {
        it('should handle multiple mod applications sequentially to prevent race conditions', async () => {
            expect.assertions(3);

            vi.mocked(isValidInstall).mockResolvedValue(true);
            vi.spyOn(fs, 'statSync').mockReturnValue({
                isDirectory: () => true,
            } as fs.Stats);

            const cpSyncSpy = vi.spyOn(fs, 'cpSync').mockImplementation(() => {
                // Simulate file operation delay
                return new Promise((resolve) => setTimeout(resolve, 10));
            });
            vi.spyOn(fs, 'existsSync').mockReturnValue(false);
            vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
                // Mock implementation
            });

            await applyModsToInstall('/valid/install', [
                'mod1',
                'mod2',
                'mod3',
            ]);

            // Verify mods were processed sequentially (cpSync called 3 times)
            expect(cpSyncSpy).toHaveBeenCalledTimes(3);

            // Verify the order of operations
            expect(cpSyncSpy).toHaveBeenNthCalledWith(
                1,
                expect.stringContaining('mod1'),
                '/valid/install',
                expect.any(Object)
            );
            expect(cpSyncSpy).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('mod2'),
                '/valid/install',
                expect.any(Object)
            );
        });
    });

    describe('error propagation to UI (Bug #6)', () => {
        it('should propagate non-permission file errors to UI layer', async () => {
            expect.assertions(1);

            vi.mocked(isValidInstall).mockResolvedValue(true);
            vi.spyOn(fs, 'statSync').mockReturnValue({
                isDirectory: () => true,
            } as fs.Stats);

            const mockError = new Error('ENOENT: no such file or directory');
            vi.spyOn(fs, 'cpSync').mockImplementation(() => {
                throw mockError;
            });

            await expect(
                applyModsToInstall('/valid/install', ['testMod'])
            ).rejects.toThrow(
                'Failed to apply mod "testMod": Error copying mod files: Error: ENOENT: no such file or directory'
            );
        });

        it('should propagate validation errors to UI layer', async () => {
            expect.assertions(1);

            vi.mocked(isValidInstall).mockResolvedValue(false);

            await expect(
                applyModsToInstall('/invalid/install', ['testMod'])
            ).rejects.toThrow(
                'Invalid installation directory: /invalid/install'
            );
        });

        it('should aggregate multiple mod errors and propagate to UI', async () => {
            expect.assertions(1);

            vi.mocked(isValidInstall).mockResolvedValue(true);
            vi.spyOn(fs, 'statSync').mockReturnValue({
                isDirectory: () => true,
            } as fs.Stats);

            let callCount = 0;
            vi.spyOn(fs, 'cpSync').mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    throw new Error('Error with mod1');
                }
                if (callCount === 2) {
                    throw new Error('Error with mod2');
                }
            });

            await expect(
                applyModsToInstall('/valid/install', ['mod1', 'mod2', 'mod3'])
            ).rejects.toThrow(
                'Multiple errors occurred during mod application'
            );
        });
    });
});
