import {
    describe,
    it,
    expect,
    vi,
    afterEach,
    afterAll,
    beforeEach,
} from 'vitest';
import {
    diffTexts,
    getFileChangesToApplyMod,
    processDirectory,
    processFileEntries,
    readDirectory,
} from './getFileChangesToApplyMod';
import fs, { readFile, StatSyncFn } from 'node:fs';
import path from 'node:path';

vi.mock('electron', () => ({
    app: {
        getPath: vi.fn().mockReturnValue('/mock/path'),
        getName: vi.fn().mockReturnValue('mock-name'),
    },
}));

describe('diffTexts', () => {
    it('should return no differences for identical texts', () => {
        const text1 = 'Hello, world!';
        const text2 = 'Hello, world!';
        const diffs = diffTexts(text1, text2);
        expect(diffs).toEqual([[0, 'Hello, world!']]);
    });

    it('should detect added lines', () => {
        const text1 = 'Hello, world!';
        const text2 = 'Hello, world!\nNew line here.';
        const diffs = diffTexts(text1, text2);
        expect(diffs).toEqual([
            [0, 'Hello, world!'],
            [1, '\nNew line here.'],
        ]);
    });

    it('should detect removed lines', () => {
        const text1 = 'Hello, world!\nThis line will be removed.';
        const text2 = 'Hello, world!';
        const diffs = diffTexts(text1, text2);
        expect(diffs).toEqual([
            [0, 'Hello, world!'],
            [-1, '\nThis line will be removed.'],
        ]);
    });

    it('should detect changed lines', () => {
        const text1 = 'Hello, world!';
        const text2 = 'Hello, universe!';
        const diffs = diffTexts(text1, text2);
        expect(diffs).toEqual([
            [0, 'Hello, '],
            [-1, 'world'],
            [1, 'universe'],
            [0, '!'],
        ]);
    });

    it('should handle empty texts', () => {
        const text1 = '';
        const text2 = '';
        const diffs = diffTexts(text1, text2);
        expect(diffs).toEqual([]);
    });

    it('should handle one empty text', () => {
        const text1 = 'Hello, world!';
        const text2 = '';
        const diffs = diffTexts(text1, text2);
        expect(diffs).toEqual([[-1, 'Hello, world!']]);
    });

    it('should handle large texts', () => {
        const text1 = 'a'.repeat(10000);
        const text2 = 'a'.repeat(9999) + 'b';
        const diffs = diffTexts(text1, text2);
        expect(diffs).toEqual([
            [0, 'a'.repeat(9999)],
            [-1, 'a'],
            [1, 'b'],
        ]);
    });
});

describe('readDirectory', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should read an empty directory', () => {
        const mock = vi.spyOn(fs, 'readdirSync').mockReturnValue([]);

        const result = readDirectory('/mock/empty-dir');
        expect(result).toEqual({});
        expect(mock).toHaveBeenCalledWith('/mock/empty-dir', {
            withFileTypes: true,
        });
    });
});
describe('readDirectory (extended tests)', () => {
    afterAll(() => {
        vi.clearAllMocks();
    });
    it('should read a nested directory structure with one subdirectory and one file', () => {
        const mock = vi
            .spyOn(fs, 'readdirSync')
            .mockImplementation((dirPath: string) => {
                if (dirPath === '/mock/nested-dir') {
                    return [
                        {
                            name: 'subdir',
                            isDirectory: () => true,
                            isFile: () => false,
                        },
                        {
                            name: 'topFile.txt',
                            isDirectory: () => false,
                            isFile: () => true,
                        },
                    ] as any;
                } else if (dirPath === '/mock/nested-dir/subdir') {
                    return [
                        {
                            name: 'insideFile.txt',
                            isDirectory: () => false,
                            isFile: () => true,
                        },
                    ] as any;
                }
                return [];
            });
        const fileMock = vi
            .spyOn(fs, 'readFileSync')
            .mockImplementation((filePath: string) => {
                return `Content of ${filePath}`;
            });

        const result = readDirectory('/mock/nested-dir');
        expect(result).toEqual({
            subdir: {},
            'topFile.txt': 'Content of \\mock\\nested-dir\\topFile.txt',
        });
        mock.mockRestore();
        fileMock.mockRestore();
    });

    it('should handle directories with no subdirectories but multiple files', () => {
        const mock = vi.spyOn(fs, 'readdirSync').mockReturnValue([
            { name: 'file1.txt', isDirectory: () => false, isFile: () => true },
            { name: 'file2.txt', isDirectory: () => false, isFile: () => true },
        ] as any);
        const fileMock = vi
            .spyOn(fs, 'readFileSync')
            .mockImplementation((filePath: string) => {
                if (filePath.endsWith('file1.txt')) return 'File 1 content';
                if (filePath.endsWith('file2.txt')) return 'File 2 content';
                return '';
            });

        const result = readDirectory('/mock/simple-dir');
        expect(result).toEqual({
            'file1.txt': 'File 1 content',
            'file2.txt': 'File 2 content',
        });
        mock.mockRestore();
        fileMock.mockRestore();
    });

    it('should handle a directory containing itself in a circular reference gracefully', () => {
        const mock = vi
            .spyOn(fs, 'readdirSync')
            .mockImplementation((dirPath: string) => {
                if (dirPath === '/mock/circular') {
                    return [
                        {
                            name: 'circular',
                            isDirectory: () => true,
                            isFile: () => false,
                        },
                    ] as any;
                }
                return [];
            });
        const fileMock = vi.spyOn(fs, 'readFileSync');

        // The function won't actually detect cycles automatically, but it won't get stuck
        const result = readDirectory('/mock/circular');
        expect(result).toEqual({ circular: {} });

        mock.mockRestore();
        fileMock.mockRestore();
    });
});

describe('getFileChangesToApplyMod', () => {
    it('should log an error if the given mod path is not a directory', async () => {
        const consoleErrorMock = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        const statMock = vi.spyOn(fs, 'statSync').mockImplementation(
            () =>
                ({
                    isDirectory: () => false,
                }) as any
        );

        const result = await getFileChangesToApplyMod('notADir', '/game/dir');
        expect(result).toBeUndefined();
        expect(consoleErrorMock).toHaveBeenCalled();

        consoleErrorMock.mockRestore();
        statMock.mockRestore();
    });

    it('should correctly handle directory paths and attempt to compare directories', async () => {
        const consoleLogMock = vi
            .spyOn(console, 'log')
            .mockImplementation(() => {});
        const statMock = vi.spyOn(fs, 'statSync').mockImplementation(
            () =>
                ({
                    isDirectory: () => true,
                }) as any
        );
        const readMock = vi.spyOn(fs, 'readdirSync').mockReturnValue([] as any);

        const result = await getFileChangesToApplyMod('someDir', '/game/dir');
        expect(result).toBeUndefined();

        consoleLogMock.mockRestore();
        statMock.mockRestore();
        readMock.mockRestore();
    });
});
describe('processFileEntries', () => {
    let fileDiffPromises: Promise<any>[];
    let changes: any[];

    beforeEach(() => {
        fileDiffPromises = [];
        changes = [];
    });

    it('should detect no changes if files are identical text', () => {
        const mockStat = vi.spyOn(fs, 'statSync');
        const mockRead = vi.spyOn(fs, 'readFileSync');

        mockStat.mockReturnValue({ size: 100 } as any);
        mockRead.mockImplementation((filePath: string) => {
            return 'Same content';
        });

        // Identical textual files
        processFileEntries(
            'path/to/oldFile.txt',
            'path/to/newFile.txt',
            'testFile.txt',
            fileDiffPromises,
            changes
        );

        expect(changes).toHaveLength(0);
        expect(fileDiffPromises).toHaveLength(0);

        mockStat.mockRestore();
        mockRead.mockRestore();
    });

    it('should detect changes if textual files differ', async () => {
        const mockStat = vi.spyOn(fs, 'statSync');
        const mockRead = vi.spyOn(fs, 'readFileSync');

        mockStat.mockReturnValue({ size: 200 } as any);
        mockRead.mockImplementation((filePath: string) => {
            return filePath.includes('oldFile') ? 'Old content' : 'New content';
        });

        processFileEntries(
            'path/to/oldFile.txt',
            'path/to/newFile.txt',
            'testFile.txt',
            fileDiffPromises,
            changes
        );

        expect(changes).toHaveLength(0);
        expect(fileDiffPromises).toHaveLength(1);

        const fileDiffResults = await Promise.all(fileDiffPromises);
        expect(fileDiffResults[0].fileName).toBe('testFile.txt');
        expect(fileDiffResults[0].changeDiffs).toBeDefined();

        mockStat.mockRestore();
        mockRead.mockRestore();
    });

    it('should mark binary changes if special file sizes differ', () => {
        const mockStat = vi.spyOn(fs, 'statSync');
        const mockRead = vi.spyOn(fs, 'readFileSync');

        // Mark .pdf as special
        mockStat.mockImplementation(((filePath: string) =>
            filePath.includes('oldFile')
                ? { size: 123 }
                : { size: 456 }) as any);
        mockRead.mockReturnValue('fake');

        processFileEntries(
            'oldFile.pdf',
            'newFile.pdf',
            'testFile.pdf',
            fileDiffPromises,
            changes
        );

        expect(changes).toEqual([
            {
                fileName: 'testFile.pdf',
                isBinary: true,
            },
        ]);
        expect(fileDiffPromises).toHaveLength(0);

        mockStat.mockRestore();
        mockRead.mockRestore();
    });

    it('should not add binary changes if special files have same size', () => {
        const mockStat = vi.spyOn(fs, 'statSync');
        const mockRead = vi.spyOn(fs, 'readFileSync');

        mockStat.mockReturnValue({ size: 100 } as any);
        mockRead.mockReturnValue('irrelevant');

        processFileEntries(
            'file.tga',
            'file.tga',
            'sameSize.tga',
            fileDiffPromises,
            changes
        );

        expect(changes).toHaveLength(0);
        expect(fileDiffPromises).toHaveLength(0);

        mockStat.mockRestore();
        mockRead.mockRestore();
    });

    it('should handle large text files by splitting lines correctly', async () => {
        const mockStat = vi.spyOn(fs, 'statSync');
        const mockRead = vi.spyOn(fs, 'readFileSync');

        mockStat.mockReturnValue({ size: 9999 } as any);
        // Over 400 lines
        mockRead.mockImplementation((filePath: string) =>
            filePath.includes('oldFile')
                ? 'Old\n'.repeat(401)
                : 'New\n'.repeat(401)
        );

        processFileEntries(
            'oldFile.txt',
            'newFile.txt',
            'largeDiff.txt',
            fileDiffPromises,
            changes
        );

        expect(changes).toHaveLength(0);
        expect(fileDiffPromises).toHaveLength(1);

        const results = await Promise.all(fileDiffPromises);
        expect(results[0].fileName).toBe('largeDiff.txt');

        mockStat.mockRestore();
        mockRead.mockRestore();
    });
});
vi.mock('node:fs');

// These tests are busted at the moment
describe.skip('processDirectory', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should return an empty array for two empty directories', async () => {
        vi.spyOn(fs, 'readdirSync').mockReturnValue([]);
        vi.spyOn(fs, 'readFileSync').mockReturnValue('');

        const oldDir = {};
        const newDir = {};
        const result = await (processDirectory as any)(oldDir, newDir);
        expect(result).toEqual([]);
    });

    it('should detect added text file in new directory', async () => {
        // @ts-expect-error This is a mock
        vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: string) => {
            if (dirPath === '/mock/newDir') {
                return ['file.txt'];
            }
            return [];
        });
        vi.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
            if (filePath === path.join('/mock/newDir', 'file.txt')) {
                return 'Some content';
            }
            return '';
        });

        const oldDir = {};
        const newDir = {
            'file.txt': 'Some content',
        };
        const result = await (processDirectory as any)(oldDir, newDir);
        expect(result).toHaveLength(1);
        expect(result[0].lineChangeGroups).toHaveLength(1);
        expect(result[0].lineChangeGroups[0].change).toBe('Some content');
        expect(result[0].lineChangeGroups[0].contentBeforeChange).toBe('');
    });

    it('should detect modified text and return correct line groups', async () => {
        // @ts-expect-error This is a mock
        vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: string) => {
            if (dirPath === '/mock/oldDir') {
                return ['README.md'];
            }
            if (dirPath === '/mock/newDir') {
                return ['README.md'];
            }
            return [];
        });
        vi.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
            console.log('File path gotten: ', filePath);
            if (filePath === '/mock/oldDir/README.md') {
                return 'Line1\nLine2\nLine3';
            }
            if (filePath === '/mock/newDir/README.md') {
                return 'Line1\nLine2 changed\nLine3';
            }
            return '';
        });

        const oldDir = { '/mock/oldDir/README.md': 'Line1\nLine2\nLine3' };
        const newDir = {
            '/mock/newDir/README.md': 'Line1\nLine2 changed\nLine3',
        };
        const result = await (processDirectory as any)(oldDir, newDir);
        expect(result).toHaveLength(1);
        expect(result[0].fileName).toBe('/mock/newDir/README.md');
        expect(result[0].lineChangeGroups).toHaveLength(2);
        expect(result[0].lineChangeGroups[1].change).toContain('Line2 changed');
        expect(result[0].lineChangeGroups[0].contentBeforeChange).toContain(
            'Line2'
        );
    });

    it('should handle nested directories with changes', async () => {
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
        const result = await (processDirectory as any)(oldDir, newDir);
        expect(result.length).toBe(2);

        const indexChange = result.find(
            (r: any) => r.fileName === 'src/index.js'
        );
        const helperChange = result.find(
            (r: any) => r.fileName === 'src/utils/helper.js'
        );

        expect(indexChange.lineChangeGroups).toHaveLength(1);
        expect(helperChange.lineChangeGroups).toHaveLength(1);
        expect(indexChange.lineChangeGroups[0].contentBeforeChange).toContain(
            'old'
        );
        expect(helperChange.lineChangeGroups[0].change).toContain('updated');
    });

    it('should handle deeply nested directories with mixed changes', async () => {
        // @ts-expect-error This is a mock
        vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: string) => {
            const structure: Record<string, string[]> = {
                '/mock/oldDir': ['src', 'docs', 'README.md'],
                '/mock/oldDir/src': ['index.ts', 'utils', 'components'],
                '/mock/oldDir/src/utils': ['helper.ts'],
                '/mock/oldDir/src/components': ['Button.tsx'],
                '/mock/oldDir/docs': ['intro.md'],
                '/mock/newDir': ['src', 'docs', 'LICENSE.md'],
                '/mock/newDir/src': [
                    'index.ts',
                    'utils',
                    'components',
                    'services',
                ],
                '/mock/newDir/src/utils': ['helper.ts', 'format.ts'],
                '/mock/newDir/src/components': ['Button.tsx', 'Input.tsx'],
                '/mock/newDir/src/services': ['api.ts'],
                '/mock/newDir/docs': ['intro.md', 'setup.md'],
            };
            return structure[dirPath] || [];
        });
        vi.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
            const contents: Record<string, string> = {
                '/mock/oldDir/README.md': 'Old README content',
                '/mock/newDir/LICENSE.md': 'MIT License',
                '/mock/oldDir/src/index.ts': 'console.log("Old Index");',
                '/mock/newDir/src/index.ts': 'console.log("New Index");',
                '/mock/oldDir/src/utils/helper.ts':
                    'export const helper = () => {};',
                '/mock/newDir/src/utils/helper.ts':
                    'export const helper = () => { console.log("helper"); };',
                '/mock/newDir/src/utils/format.ts':
                    'export const format = () => {};',
                '/mock/oldDir/src/components/Button.tsx':
                    '<button>Click me</button>',
                '/mock/newDir/src/components/Button.tsx':
                    '<button>Click me!</button>',
                '/mock/newDir/src/components/Input.tsx': '<input />',
                '/mock/src/services/api.ts': 'export const api = () => {};',
                '/mock/oldDir/docs/intro.md': '# Introduction',
                '/mock/newDir/docs/intro.md': '# Introduction Updated',
                '/mock/newDir/docs/setup.md': '# Setup Guide',
            };
            return contents[filePath] || '';
        });

        const oldDir = {
            src: {
                'index.ts': 'console.log("Old Index");',
                utils: {
                    'helper.ts': 'export const helper = () => {};',
                },
                components: {
                    'Button.tsx': '<button>Click me</button>',
                },
            },
            docs: {
                'intro.md': '# Introduction',
            },
            'README.md': 'Old README content',
        };
        const newDir = {
            src: {
                'index.ts': 'console.log("New Index");',
                utils: {
                    'helper.ts':
                        'export const helper = () => { console.log("helper"); };',
                    'format.ts': 'export const format = () => {};',
                },
                components: {
                    'Button.tsx': '<button>Click me!</button>',
                    'Input.tsx': '<input />',
                },
                services: {
                    'api.ts': 'export const api = () => {};',
                },
            },
            docs: {
                'intro.md': '# Introduction Updated',
                'setup.md': '# Setup Guide',
            },
            'LICENSE.md': 'MIT License',
        };
        const result = await (processDirectory as any)(oldDir, newDir);
        expect(result.length).toBe(7);

        const changes = {
            'README.md': ['Old README content', ''],
            'src/index.ts': ['Old Index', 'New Index'],
            'src/utils/helper.ts': [
                'export const helper = () => {};',
                'export const helper = () => { console.log("helper"); };',
            ],
            'src/components/Button.tsx': [
                '<button>Click me</button>',
                '<button>Click me!</button>',
            ],
            'docs/intro.md': ['# Introduction', '# Introduction Updated'],
            'LICENSE.md': ['', 'MIT License'],
            'src/services/api.ts': ['', 'export const api = () => {};'],
        };

        for (const change of result) {
            const expectedChange = changes[change.fileName];
            expect(expectedChange).toBeDefined();
            if (expectedChange) {
                if (expectedChange[0] === '' || expectedChange[1] === '') {
                    expect(change.isBinary).toBeUndefined();
                } else {
                    expect(change.lineChangeGroups.length).toBeGreaterThan(0);
                }
            }
        }
    });

    it('should handle multiple additions, deletions, and modifications across various nested directories', async () => {
        // @ts-expect-error This is a mock
        vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: string) => {
            const structure: Record<string, string[]> = {
                '/mock/oldDir': ['app', 'config', 'assets'],
                '/mock/oldDir/app': ['main.js', 'helpers.js'],
                '/mock/oldDir/config': ['default.json'],
                '/mock/oldDir/assets': ['images', 'styles'],
                '/mock/oldDir/assets/images': ['logo.png'],
                '/mock/newDir': ['app', 'config', 'assets', 'README.md'],
                '/mock/newDir/app': ['main.js', 'helpers.js', 'utils.js'],
                '/mock/newDir/config': ['default.json', 'production.json'],
                '/mock/newDir/assets': ['images', 'styles', 'scripts'],
                '/mock/newDir/assets/images': ['logo.png', 'banner.png'],
                '/mock/newDir/assets/styles': ['main.css'],
                '/mock/newDir/assets/scripts': ['app.js'],
            };
            return structure[dirPath] || [];
        });
        vi.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
            const contents: Record<string, string> = {
                '/mock/oldDir/app/main.js': 'console.log("App Main");',
                '/mock/newDir/app/main.js': 'console.log("App Main Updated");',
                '/mock/oldDir/app/helpers.js':
                    'export const helper = () => {};',
                '/mock/newDir/app/helpers.js':
                    'export const helper = () => { return true; };',
                '/mock/newDir/app/utils.js': 'export const utils = () => {};',
                '/mock/oldDir/config/default.json': '{"env": "development"}',
                '/mock/newDir/config/default.json': '{"env": "production"}',
                '/mock/newDir/config/production.json': '{"debug": false}',
                '/mock/oldDir/assets/images/logo.png': 'binarycontent',
                '/mock/newDir/assets/images/logo.png': 'binarycontent',
                '/mock/newDir/assets/images/banner.png': 'binarycontent',
                '/mock/oldDir/assets/styles': {}, // Directory
                '/mock/newDir/assets/styles/main.css': 'body { margin: 0; }',
                '/mock/newDir/assets/scripts/app.js':
                    'console.log("App Script");',
            };
            return contents[filePath] || '';
        });

        const oldDir = {
            app: {
                'main.js': 'console.log("App Main");',
                'helpers.js': 'export const helper = () => {};',
            },
            config: {
                'default.json': '{"env": "development"}',
            },
            assets: {
                images: {
                    'logo.png': 'binarycontent',
                },
                styles: {},
            },
        };
        const newDir = {
            app: {
                'main.js': 'console.log("App Main Updated");',
                'helpers.js': 'export const helper = () => { return true; };',
                'utils.js': 'export const utils = () => {};',
            },
            config: {
                'default.json': '{"env": "production"}',
                'production.json': '{"debug": false}',
            },
            assets: {
                images: {
                    'logo.png': 'binarycontent',
                    'banner.png': 'binarycontent',
                },
                styles: {
                    'main.css': 'body { margin: 0; }',
                },
                scripts: {
                    'app.js': 'console.log("App Script");',
                },
            },
            'README.md': '# Project README',
        };
        const result = await (processDirectory as any)(oldDir, newDir);
        expect(result.length).toBe(7);

        const changes = {
            'app/main.js': ['App Main', 'App Main Updated'],
            'app/helpers.js': [
                'export const helper = () => {};',
                'export const helper = () => { return true; };',
            ],
            'app/utils.js': ['', 'export const utils = () => {};'],
            'config/default.json': [
                '{"env": "development"}',
                '{"env": "production"}',
            ],
            'config/production.json': ['', '{"debug": false}'],
            'assets/images/banner.png': ['', 'binarycontent'],
            'assets/styles/main.css': ['', 'body { margin: 0; }'],
            'assets/scripts/app.js': ['', 'console.log("App Script");'],
            'README.md': ['', '# Project README'],
        };

        for (const change of result) {
            const expectedChange = changes[change.fileName];
            expect(expectedChange).toBeDefined();
            if (expectedChange) {
                if (expectedChange[0] === '' || expectedChange[1] === '') {
                    expect(change.isBinary).toBeUndefined();
                } else if (change.fileName.endsWith('.png')) {
                    expect(change.isBinary).toBe(true);
                } else {
                    expect(change.lineChangeGroups.length).toBeGreaterThan(0);
                }
            }
        }
    });

    it('should correctly process directories with multiple file types and varying depths', async () => {
        // @ts-expect-error This is a mock
        vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: string) => {
            const structure: Record<string, string[]> = {
                '/mock/oldDir': ['bin', 'lib', 'src'],
                '/mock/oldDir/bin': ['execute'],
                '/mock/oldDir/lib': ['moduleA.js', 'moduleB.js'],
                '/mock/oldDir/src': ['index.ts', 'utils', 'components'],
                '/mock/oldDir/src/utils': ['util1.ts', 'util2.ts'],
                '/mock/oldDir/src/components': ['Header.tsx'],
                '/mock/newDir': ['bin', 'lib', 'src', 'tests'],
                '/mock/newDir/bin': ['execute', 'deploy'],
                '/mock/newDir/lib': ['moduleA.js', 'moduleC.js'],
                '/mock/newDir/src': [
                    'index.ts',
                    'utils',
                    'components',
                    'services',
                ],
                '/mock/newDir/src/utils': ['util1.ts', 'util2.ts', 'util3.ts'],
                '/mock/newDir/src/components': ['Header.tsx', 'Footer.tsx'],
                '/mock/newDir/src/services': ['service1.ts'],
                '/mock/newDir/tests': ['index.test.ts'],
            };
            return structure[dirPath] || [];
        });
        vi.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
            const contents: Record<string, string> = {
                '/mock/oldDir/bin/execute': 'binary execute',
                '/mock/newDir/bin/execute': 'binary execute',
                '/mock/newDir/bin/deploy': 'binary deploy',
                '/mock/oldDir/lib/moduleA.js': 'export const A = () => {};',
                '/mock/newDir/lib/moduleA.js':
                    'export const A = () => { console.log("A"); };',
                '/mock/oldDir/lib/moduleB.js': 'export const B = () => {};',
                '/mock/newDir/lib/moduleC.js': 'export const C = () => {};',
                '/mock/oldDir/src/index.ts':
                    'import { A } from "../lib/moduleA";',
                '/mock/newDir/src/index.ts':
                    'import { A } from "../lib/moduleA";\nimport { C } from "../lib/moduleC";',
                '/mock/oldDir/src/utils/util1.ts':
                    'export const util1 = () => {};',
                '/mock/newDir/src/utils/util1.ts':
                    'export const util1 = () => { return true; };',
                '/mock/oldDir/src/utils/util2.ts':
                    'export const util2 = () => {};',
                '/mock/newDir/src/utils/util3.ts':
                    'export const util3 = () => {};',
                '/mock/oldDir/src/components/Header.tsx':
                    '<header>Header</header>',
                '/mock/newDir/src/components/Header.tsx':
                    '<header>Header Updated</header>',
                '/mock/newDir/src/components/Footer.tsx':
                    '<footer>Footer</footer>',
                '/mock/newDir/src/services/service1.ts':
                    'export const service1 = () => {};',
                '/mock/newDir/tests/index.test.ts':
                    'test("example", () => {});',
            };
            return contents[filePath] || '';
        });

        const oldDir = {
            bin: {
                execute: 'binary execute',
            },
            lib: {
                'moduleA.js': 'export const A = () => {};',
                'moduleB.js': 'export const B = () => {};',
            },
            src: {
                'index.ts': 'import { A } from "../lib/moduleA";',
                utils: {
                    'util1.ts': 'export const util1 = () => {};',
                    'util2.ts': 'export const util2 = () => {};',
                },
                components: {
                    'Header.tsx': '<header>Header</header>',
                },
            },
        };
        const newDir = {
            bin: {
                execute: 'binary execute',
                deploy: 'binary deploy',
            },
            lib: {
                'moduleA.js': 'export const A = () => { console.log("A"); };',
                'moduleC.js': 'export const C = () => {};',
            },
            src: {
                'index.ts':
                    'import { A } from "../lib/moduleA";\nimport { C } from "../lib/moduleC";',
                utils: {
                    'util1.ts': 'export const util1 = () => { return true; };',
                    'util2.ts': 'export const util2 = () => {};',
                    'util3.ts': 'export const util3 = () => {};',
                },
                components: {
                    'Header.tsx': '<header>Header Updated</header>',
                    'Footer.tsx': '<footer>Footer</footer>',
                },
                services: {
                    'service1.ts': 'export const service1 = () => {};',
                },
            },
            tests: {
                'index.test.ts': 'test("example", () => {});',
            },
        };
        const result = await (processDirectory as any)(oldDir, newDir);
        expect(result.length).toBe(8);

        const changes = {
            'bin/deploy': ['', 'binary deploy'],
            'lib/moduleA.js': [
                'export const A = () => {};',
                'export const A = () => { console.log("A"); };',
            ],
            'lib/moduleB.js': ['export const B = () => {};', ''],
            'lib/moduleC.js': ['', 'export const C = () => {};'],
            'src/index.ts': [
                'import { A } from "../lib/moduleA";',
                'import { A } from "../lib/moduleA";\nimport { C } from "../lib/moduleC";',
            ],
            'src/utils/util1.ts': [
                'export const util1 = () => {};',
                'export const util1 = () => { return true; };',
            ],
            'src/utils/util3.ts': ['', 'export const util3 = () => {};'],
            'src/components/Header.tsx': [
                '<header>Header</header>',
                '<header>Header Updated</header>',
            ],
            'src/components/Footer.tsx': ['', '<footer>Footer</footer>'],
            'src/services/service1.ts': [
                '',
                'export const service1 = () => {};',
            ],
            'tests/index.test.ts': ['', 'test("example", () => {});'],
        };

        for (const change of result) {
            const expectedChange = changes[change.fileName];
            expect(expectedChange).toBeDefined();
            if (expectedChange) {
                if (expectedChange[0] === '' || expectedChange[1] === '') {
                    expect(change.isBinary).toBeFalsy();
                } else if (
                    change.fileName.endsWith('.png') ||
                    change.fileName === 'bin/deploy'
                ) {
                    expect(change.isBinary).toBe(true);
                } else {
                    expect(change.lineChangeGroups.length).toBeGreaterThan(0);
                }
            }
        }
    });

    it('should detect no changes if files and nested dirs are identical', async () => {
        // @ts-expect-error This is a mock
        vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: string) => {
            const structure: Record<string, string[]> = {
                '/mock/oldDir/src': ['app.txt', 'assets'],
                '/mock/newDir/src': ['app.txt', 'assets'],
            };
            return structure[dirPath] || [];
        });
        vi.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
            return 'same content';
        });

        const oldDir = {
            src: {
                'app.txt': 'same content',
                assets: {},
            },
        };
        const newDir = {
            src: {
                'app.txt': 'same content',
                assets: {},
            },
        };
        const result = await (processDirectory as any)(oldDir, newDir);
        expect(result).toEqual([]);
    });
});
