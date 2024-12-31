import { describe, it, vi, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { diffDirectories } from './diffDirectories';
import { TextFileChange } from './getFileChangesToApplyMod';

vi.mock('electron', () => ({
    app: {
        getPath: vi.fn().mockReturnValue('/mock/path'),
        getName: vi.fn().mockReturnValue('mock-name'),
    },
}));
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
        expect(result[0].isBinary).toBe(false);
        expect(result[1].isBinary).toBe(false);

        // appease typescript
        const resultTextChanges: TextFileChange[] = result as TextFileChange[];

        console.log('resultTextChanges', resultTextChanges[0].lineChangeGroups);
    });
});
