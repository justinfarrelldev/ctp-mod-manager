import { afterEach, describe, it, vi, expect } from 'vitest';
import { DirectoryContents } from './getFileChangesToApplyMod';
import fs from 'node:fs';
import path from 'node:path';
import { diffDirectories } from './diffDirectories';

vi.mock('electron', () => ({
    app: {
        getPath: vi.fn().mockReturnValue('/mock/path'),
        getName: vi.fn().mockReturnValue('mock-name'),
    },
}));

const TEST_OLD_DIR = {
    src: {
        'index.js': 'console.log("old");',
        utils: {
            'helper.js': 'function helper() {}',
        },
    },
};
const TEST_NEW_DIR = {
    src: {
        'index.js': 'console.log("new");',
        utils: {
            'helper.js': 'function helper() { console.log("updated"); }',
        },
    },
};

describe('diffDirectories', () => {
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

        expect(result.length).toBe(2);

        const indexChange = result.find(
            (r: any) => r.fileName === 'src/index.js'
        );
        const helperChange = result.find(
            (r: any) => r.fileName === 'src/utils/helper.js'
        );

        // expect(indexChange.lineChangeGroups).toHaveLength(1);
        // expect(helperChange.lineChangeGroups).toHaveLength(1);
        // expect(indexChange.lineChangeGroups[0].contentBeforeChange).toContain(
        //     'old'
        // );
        // expect(helperChange.lineChangeGroups[0].change).toContain('updated');
    });
});
