import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyModsToInstall } from '../electron/file/applyModsToInstall';

// Mock electron module
vi.mock('electron', () => ({
    app: {
        getName: vi.fn().mockReturnValue('ctp-mod-manager'),
        getPath: vi.fn().mockReturnValue('/mock/path'),
    },
}));

describe('mod application integration tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should demonstrate error propagation from backend to potential UI layer', async () => {
        expect.assertions(1);

        // This test demonstrates that errors are now properly thrown
        // and can be caught by the UI layer, instead of being silently logged
        await expect(
            applyModsToInstall('/nonexistent/path', ['testMod'])
        ).rejects.toBeInstanceOf(Error);
    });

    it('should show that errors contain helpful information for users', async () => {
        expect.assertions(1);

        await expect(
            applyModsToInstall('/invalid/installation', ['testMod'])
        ).rejects.toThrow('ENOENT: no such file or directory');
    });
});
