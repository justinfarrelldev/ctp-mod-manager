import { afterEach, describe, expect, it, vi } from 'vitest';

import { InstallDirectory } from '../../App';
import { detectCtpVersion } from './detectCtpVersion';
import { enrichInstallDirsWithCtpVersion } from './enrichInstallDirsWithCtpVersion';

vi.mock('./detectCtpVersion');
const mockedDetectCtpVersion = vi.mocked(detectCtpVersion);

describe('enrichInstallDirsWithCtpVersion', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });
    it('should add CTP version information to each installation directory', async () => {
        expect.hasAssertions();

        const installDirs: InstallDirectory[] = [
            {
                directory: '/ctp1/install',
                installationType: 'steam',
                os: 'win32',
            },
            {
                directory: '/ctp2/install',
                installationType: 'gog',
                os: 'linux',
            },
        ];

        mockedDetectCtpVersion
            .mockResolvedValueOnce('CTP1')
            .mockResolvedValueOnce('CTP2');

        const result = await enrichInstallDirsWithCtpVersion(installDirs);

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
            ctpVersion: 'CTP1',
            directory: '/ctp1/install',
            installationType: 'steam',
            os: 'win32',
        });
        expect(result[1]).toMatchObject({
            ctpVersion: 'CTP2',
            directory: '/ctp2/install',
            installationType: 'gog',
            os: 'linux',
        });
        expect(detectCtpVersion).toHaveBeenCalledTimes(2);
        expect(detectCtpVersion).toHaveBeenCalledWith('/ctp1/install');
        expect(detectCtpVersion).toHaveBeenCalledWith('/ctp2/install');
    });

    it('should handle empty installation directories array', async () => {
        expect.hasAssertions();

        const installDirs: InstallDirectory[] = [];
        const result = await enrichInstallDirsWithCtpVersion(installDirs);

        expect(result).toHaveLength(0);
        expect(detectCtpVersion).not.toHaveBeenCalled();
    });

    it('should handle detection errors gracefully by setting version to Unknown', async () => {
        expect.hasAssertions();

        const installDirs: InstallDirectory[] = [
            {
                directory: '/error/install',
                installationType: 'steam',
                os: 'win32',
            },
        ];

        mockedDetectCtpVersion.mockResolvedValueOnce('Unknown');

        const result = await enrichInstallDirsWithCtpVersion(installDirs);

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            ctpVersion: 'Unknown',
            directory: '/error/install',
            installationType: 'steam',
            os: 'win32',
        });
    });

    it('should preserve all original properties when adding CTP version', async () => {
        expect.hasAssertions();

        const installDirs: InstallDirectory[] = [
            {
                directory: '/wsl/install',
                installationType: 'steam',
                isWSL: true,
                os: 'linux',
            },
        ];

        mockedDetectCtpVersion.mockResolvedValueOnce('CTP2');

        const result = await enrichInstallDirsWithCtpVersion(installDirs);

        expect(result[0]).toMatchObject({
            ctpVersion: 'CTP2',
            directory: '/wsl/install',
            installationType: 'steam',
            isWSL: true,
            os: 'linux',
        });
    });
});
