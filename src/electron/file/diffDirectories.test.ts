import { describe, it, vi, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach } from 'vitest';
import { diffDirectories } from './diffDirectories';
import { TextFileChange } from './getFileChangesToApplyMod';

vi.mock('electron', () => ({
    app: {
        getPath: vi.fn().mockReturnValue('/mock/path'),
        getName: vi.fn().mockReturnValue('mock-name'),
    },
}));
describe('diffDirectories', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });
    it(`should be able to diff nested directories`, () => {
        // @ts-expect-error This is a mock
        vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: string) => {
            const structure: Record<string, string[]> = {
                '/mock/oldDir/src': ['index.js', 'utils'],
                '/mock/oldDir/src/utils': ['helper.js'],
                '/mock/newDir/src': ['index.js', 'utils'],
                '/mock/newDir/src/utils': ['helper.js'],
            };
            return structure[dirPath] || [];
        });
        vi.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
            if (filePath === path.join('/mock/oldDir/src', 'index.js')) {
                return 'console.log("old");';
            }
            if (filePath === path.join('/mock/newDir/src', 'index.js')) {
                return 'console.log("new");';
            }
            if (filePath === path.join('/mock/oldDir/src/utils', 'helper.js')) {
                return 'function helper() {}';
            }
            if (filePath === path.join('/mock/newDir/src/utils', 'helper.js')) {
                return 'function helper() { console.log("updated"); }';
            }
            return '';
        });

        const oldDir = {
            src: {
                'index.js': 'console.log("old");',
                utils: {
                    'helper.js': 'function helper() {}',
                },
            },
        };
        const newDir = {
            src: {
                'index.js': 'console.log("new");',
                utils: {
                    'helper.js':
                        'function helper() { console.log("updated"); }',
                },
            },
        };
        const result = diffDirectories({
            oldDir,
            newDir,
        });

        expect(result.length).toBe(4);
        expect(result[0].isBinary).toBe(false);
        expect(result[1].isBinary).toBe(false);

        // appease typescript
        const resultTextChanges: TextFileChange[] = result as TextFileChange[];

        expect(resultTextChanges[0].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[0].lineChangeGroups[0].endLineNumber).toBe(1);
        expect(resultTextChanges[1].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[1].lineChangeGroups[0].endLineNumber).toBe(1);

        console.log('resultTextChanges', resultTextChanges[0].lineChangeGroups);
    });

    it(`should handle multi-line file changes`, () => {
        const oldDir = {
            src: {
                'index.js': `console.log("old line 1");
    console.log("old line 2");`,
            },
        };
        const newDir = {
            src: {
                'index.js': `console.log("new line 1");
    console.log("new line 2");`,
            },
        };
        const result = diffDirectories({
            oldDir,
            newDir,
        });

        expect(result.length).toBe(4);
        expect(result[0].isBinary).toBe(false);

        const resultTextChanges: TextFileChange[] = result as TextFileChange[];

        expect(resultTextChanges[0].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[0].lineChangeGroups[0].endLineNumber).toBe(1);
        expect(resultTextChanges[1].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[1].lineChangeGroups[0].endLineNumber).toBe(1);
        expect(resultTextChanges[1].lineChangeGroups[0].changeType).toBe('add');

        expect(resultTextChanges[2].lineChangeGroups[0].startLineNumber).toBe(
            2
        );
        expect(resultTextChanges[2].lineChangeGroups[0].endLineNumber).toBe(2);
        expect(resultTextChanges[2].lineChangeGroups[0].changeType).toBe(
            'remove'
        );

        expect(resultTextChanges[3].lineChangeGroups[0].startLineNumber).toBe(
            2
        );
        expect(resultTextChanges[3].lineChangeGroups[0].endLineNumber).toBe(2);
        expect(resultTextChanges[3].lineChangeGroups[0].changeType).toBe('add');
    });

    it(`should handle added multi-line files`, () => {
        const oldDir = {
            src: {},
        };
        const newDir = {
            src: {
                'index.js': `console.log("new line 1");
    console.log("new line 2");`,
            },
        };
        const result = diffDirectories({
            oldDir,
            newDir,
        });

        expect(result.length).toBe(1);
        expect(result[0].isBinary).toBe(false);

        const resultTextChanges: TextFileChange[] = result as TextFileChange[];

        expect(resultTextChanges[0].lineChangeGroups[0].startLineNumber).toBe(
            0
        );
        expect(resultTextChanges[0].lineChangeGroups[0].endLineNumber).toBe(2);
    });

    it(`should handle removed multi-line files`, () => {
        const oldDir = {
            src: {
                'index.js': `console.log("old line 1");
    console.log("old line 2");`,
            },
        };
        const newDir = {
            src: {},
        };
        const result = diffDirectories({
            oldDir,
            newDir,
        });

        console.log('result', result);

        expect(result.length).toBe(1);
        expect(result[0].isBinary).toBe(false);

        const resultTextChanges: TextFileChange[] = result as TextFileChange[];

        expect(resultTextChanges[0].lineChangeGroups[0].startLineNumber).toBe(
            0
        );
        expect(resultTextChanges[0].lineChangeGroups[0].endLineNumber).toBe(2);
    });

    it.only('should handle many different files in various folders with mixed file types', () => {
        // @ts-expect-error This is a mock
        vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: string) => {
            const structure: Record<string, string[]> = {
                '/mock/oldDir': [
                    'src',
                    'assets',
                    'docs',
                    'scripts',
                    'images',
                    'config',
                    'tests',
                    'libs',
                    'bin',
                    'temp',
                ],
                '/mock/oldDir/src': [
                    'app.ts',
                    'utils.ts',
                    'constants.ts',
                    'service.ts',
                    'controller.ts',
                ],
                '/mock/oldDir/assets': [
                    'style.css',
                    'theme.css',
                    'logo.png',
                    'background.png',
                    'icons.png',
                ],
                '/mock/oldDir/docs': [
                    'README.md',
                    'CHANGELOG.md',
                    'LICENSE.pdf',
                    'CONTRIBUTING.pdf',
                    'API.pdf',
                ],
                '/mock/oldDir/scripts': [
                    'build.sh',
                    'deploy.sh',
                    'setup.sh',
                    'cleanup.sh',
                    'test.sh',
                ],
                '/mock/oldDir/images': [
                    'banner.png',
                    'header.png',
                    'footer.png',
                    'sidebar.png',
                    'profile.png',
                ],
                '/mock/oldDir/config': [
                    'config.json',
                    'settings.json',
                    'env.json',
                    'db.json',
                    'auth.json',
                ],
                '/mock/oldDir/tests': [
                    'app.test.ts',
                    'utils.test.ts',
                    'service.test.ts',
                    'controller.test.ts',
                    'integration.test.ts',
                ],
                '/mock/oldDir/libs': [
                    'library1.pdf',
                    'library2.pdf',
                    'library3.pdf',
                    'library4.pdf',
                    'library5.pdf',
                ],
                '/mock/oldDir/bin': [
                    'execute.exe',
                    'run.exe',
                    'start.exe',
                    'stop.exe',
                    'restart.exe',
                ],
                '/mock/newDir': [
                    'src',
                    'assets',
                    'docs',
                    'scripts',
                    'images',
                    'config',
                    'tests',
                    'libs',
                    'bin',
                    'logs',
                ],
                '/mock/newDir/src': [
                    'app.ts',
                    'utils.ts',
                    'constants.ts',
                    'service.ts',
                    'controller.ts',
                    'newFeature.ts',
                ],
                '/mock/newDir/assets': [
                    'style.css',
                    'theme-dark.css',
                    'logo.png',
                    'background-new.png',
                    'icons.png',
                ],
                '/mock/newDir/docs': [
                    'README.md',
                    'CHANGELOG.md',
                    'LICENSE.pdf',
                    'CONTRIBUTING.pdf',
                    'API_v2.pdf',
                ],
                '/mock/newDir/scripts': [
                    'build.sh',
                    'deploy.sh',
                    'setup.sh',
                    'cleanup.sh',
                    'test.sh',
                    'migrate.sh',
                ],
                '/mock/newDir/images': [
                    'banner_new.png',
                    'header.png',
                    'footer.png',
                    'sidebar_new.png',
                    'profile.png',
                ],
                '/mock/newDir/config': [
                    'config.json',
                    'settings.json',
                    'env.production.json',
                    'db.json',
                    'auth.json',
                ],
                '/mock/newDir/tests': [
                    'app.test.ts',
                    'utils.test.ts',
                    'service.test.ts',
                    'controller.test.ts',
                    'integration.test.ts',
                    'e2e.test.ts',
                ],
                '/mock/newDir/libs': [
                    'library1.pdf',
                    'library2_updated.pdf',
                    'library3.pdf',
                    'library6.pdf',
                    'library7.pdf',
                ],
                '/mock/newDir/bin': [
                    'execute.exe',
                    'run.exe',
                    'start.exe',
                    'stop.exe',
                    'deploy.exe',
                ],
                '/mock/newDir/logs': [
                    'app.log',
                    'error.log',
                    'access.log',
                    'debug.log',
                    'audit.log',
                ],
            };
            return structure[dirPath] || [];
        });

        vi.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
            if (
                filePath.endsWith('.ts') ||
                filePath.endsWith('.js') ||
                filePath.endsWith('.css') ||
                filePath.endsWith('.sh') ||
                filePath.endsWith('.json') ||
                filePath.endsWith('.md')
            ) {
                return 'const sample = "text content";';
            } else if (
                filePath.endsWith('.pdf') ||
                filePath.endsWith('.png') ||
                filePath.endsWith('.exe') ||
                filePath.endsWith('.log')
            ) {
                return Buffer.from([0x00, 0x01, 0x02]);
            }
            return '';
        });
        const oldDir = {
            src: {
                'app.ts': 'const sample = "text content";',
                'utils.ts': 'const sample = "text content";',
                'constants.ts': 'const sample = "text content";',
                'service.ts': 'const sample = "text content";',
                'controller.ts': 'const sample = "text content";',
            },
            assets: {
                'style.css': 'const sample = "text content";',
                'theme.css': 'const sample = "text content";',
                'logo.png': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'background.png': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'icons.png': Buffer.from([0x00, 0x01, 0x02]).toString(),
            },
            docs: {
                'README.md': 'const sample = "text content";',
                'CHANGELOG.md': 'const sample = "text content";',
                'LICENSE.pdf': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'CONTRIBUTING.pdf': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'API.pdf': Buffer.from([0x00, 0x01, 0x02]).toString(),
            },
            scripts: {
                'build.sh': 'const sample = "text content";',
                'deploy.sh': 'const sample = "text content";',
                'setup.sh': 'const sample = "text content";',
                'cleanup.sh': 'const sample = "text content";',
                'test.sh': 'const sample = "text content";',
            },
            images: {
                'banner.png': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'header.png': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'footer.png': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'sidebar.png': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'profile.png': Buffer.from([0x00, 0x01, 0x02]).toString(),
            },
            config: {
                'config.json': 'const sample = "text content";',
                'settings.json': 'const sample = "text content";',
                'env.json': 'const sample = "text content";',
                'db.json': 'const sample = "text content";',
                'auth.json': 'const sample = "text content";',
            },
            tests: {
                'app.test.ts': 'const sample = "text content";',
                'utils.test.ts': 'const sample = "text content";',
                'service.test.ts': 'const sample = "text content";',
                'controller.test.ts': 'const sample = "text content";',
                'integration.test.ts': 'const sample = "text content";',
            },
            libs: {
                'library1.pdf': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'library2.pdf': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'library3.pdf': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'library4.pdf': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'library5.pdf': Buffer.from([0x00, 0x01, 0x02]).toString(),
            },
            bin: {
                'execute.exe': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'run.exe': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'start.exe': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'stop.exe': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'restart.exe': Buffer.from([0x00, 0x01, 0x02]).toString(),
            },
        };

        const newDir = {
            src: {
                'app.ts': 'const sample = "text content";',
                'utils.ts': 'const sample = "text content";',
                'constants.ts': 'const sample = "text content";',
                'service.ts': 'const sample = "text content";',
                'controller.ts': 'const sample = "text content";',
                'newFeature.ts': 'const newFeature = "added";',
            },
            assets: {
                'style.css': 'const sample = "text content";',
                'theme-dark.css': 'const sample = "text content";',
                'logo.png': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'background-new.png': Buffer.from([
                    0x00, 0x01, 0x02,
                ]).toString(),
                'icons.png': Buffer.from([0x00, 0x01, 0x02]).toString(),
            },
            docs: {
                'README.md': 'const sample = "text content";',
                'CHANGELOG.md': 'const sample = "text content";',
                'LICENSE.pdf': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'CONTRIBUTING.pdf': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'API_v2.pdf': Buffer.from([0x00, 0x01, 0x02]).toString(),
            },
            scripts: {
                'build.sh': 'const sample = "text content";',
                'deploy.sh': 'const sample = "text content";',
                'setup.sh': 'const sample = "text content";',
                'cleanup.sh': 'const sample = "text content";',
                'test.sh': 'const sample = "text content";',
                'migrate.sh': 'const sample = "text content";',
            },
            images: {
                'banner_new.png': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'header.png': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'footer.png': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'sidebar_new.png': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'profile.png': Buffer.from([0x00, 0x01, 0x02]).toString(),
            },
            config: {
                'config.json': 'const sample = "text content";',
                'settings.json': 'const sample = "text content";',
                'env.production.json': 'const sample = "text content";',
                'db.json': 'const sample = "text content";',
                'auth.json': 'const sample = "text content";',
            },
            tests: {
                'app.test.ts': 'const sample = "text content";',
                'utils.test.ts': 'const sample = "text content";',
                'service.test.ts': 'const sample = "text content";',
                'controller.test.ts': 'const sample = "text content";',
                'integration.test.ts': 'const sample = "text content";',
                'e2e.test.ts': 'const sample = "text content";',
            },
            libs: {
                'library1.pdf': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'library2_updated.pdf': Buffer.from([
                    0x00, 0x01, 0x02,
                ]).toString(),
                'library3.pdf': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'library6.pdf': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'library7.pdf': Buffer.from([0x00, 0x01, 0x02]).toString(),
            },
            bin: {
                'execute.exe': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'run.exe': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'start.exe': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'stop.exe': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'deploy.exe': Buffer.from([0x00, 0x01, 0x02]).toString(),
            },
            logs: {
                'app.log': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'error.log': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'access.log': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'debug.log': Buffer.from([0x00, 0x01, 0x02]).toString(),
                'audit.log': Buffer.from([0x00, 0x01, 0x02]).toString(),
            },
        };

        const result = diffDirectories({
            oldDir,
            newDir,
        });

        console.log('result: ', result);

        expect(result.length).toBeGreaterThan(0);

        // Check for added files
        expect(result).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: 'src/newFeature.ts',
                    isBinary: false,
                }),
                expect.objectContaining({
                    path: 'assets/theme-dark.css',
                    isBinary: false,
                }),
                expect.objectContaining({
                    path: 'assets/background-new.png',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'docs/API_v2.pdf',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'scripts/migrate.sh',
                    isBinary: false,
                }),
                expect.objectContaining({
                    path: 'images/banner_new.png',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'images/sidebar_new.png',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'config/env.production.json',
                    isBinary: false,
                }),
                expect.objectContaining({
                    path: 'tests/e2e.test.ts',
                    isBinary: false,
                }),
                expect.objectContaining({
                    path: 'libs/library2_updated.pdf',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'libs/library6.pdf',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'libs/library7.pdf',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'bin/deploy.exe',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'logs/app.log',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'logs/error.log',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'logs/access.log',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'logs/debug.log',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'logs/audit.log',
                    isBinary: true,
                }),
            ])
        );

        // Check for removed files
        expect(result).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: 'assets/theme.css',
                    isBinary: false,
                }),
                expect.objectContaining({
                    path: 'assets/background.png',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'docs/API.pdf',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'scripts/cleanup.sh',
                    isBinary: false,
                }),
                expect.objectContaining({
                    path: 'images/banner.png',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'images/sidebar.png',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'libs/library4.pdf',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'libs/library5.pdf',
                    isBinary: true,
                }),
                expect.objectContaining({
                    path: 'bin/restart.exe',
                    isBinary: true,
                }),
            ])
        );

        // Check for modified files
        expect(result).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: 'src/utils.ts',
                    isBinary: false,
                }),
                expect.objectContaining({
                    path: 'libs/library2.pdf',
                    isBinary: true,
                }),
            ])
        );
    });
});
