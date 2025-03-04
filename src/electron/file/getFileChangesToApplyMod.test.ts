import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

import {
    CHUNK_SIZE,
    consolidateLineChangeGroups,
    diffTexts,
    getFileChangesToApplyMod,
 splitIntoChunks } from './getFileChangesToApplyMod';
import { LineChangeGroup } from './lineChangeGroup';

vi.mock('electron', () => ({
    app: {
        getName: vi.fn().mockReturnValue('mock-name'),
        getPath: vi.fn().mockReturnValue('/mock/path'),
    },
}));

describe('consolidateLineChangeGroups', () => {
    it('should consolidate matching remove/add pairs into replace operations', () => {
        const input: LineChangeGroup[] = [
            {
                changeType: 'remove',
                endLineNumber: 1,
                oldContent: 'foo',
                startLineNumber: 1,
            },
            {
                changeType: 'add',
                endLineNumber: 1,
                newContent: 'bar',
                startLineNumber: 1,
            },
        ];

        const expected: LineChangeGroup[] = [
            {
                changeType: 'replace',
                endLineNumber: 1,
                newContent: 'bar',
                oldContent: 'foo',
                startLineNumber: 1,
            },
        ];

        expect(consolidateLineChangeGroups(input)).toEqual(expected);
    });

    it('should not consolidate non-matching remove/add pairs', () => {
        const input: LineChangeGroup[] = [
            {
                changeType: 'remove',
                endLineNumber: 1,
                oldContent: 'foo',
                startLineNumber: 1,
            },
            {
                changeType: 'add',
                endLineNumber: 2,
                newContent: 'bar',
                startLineNumber: 2,
            },
        ];

        const expected: LineChangeGroup[] = [
            {
                changeType: 'remove',
                endLineNumber: 1,
                oldContent: 'foo',
                startLineNumber: 1,
            },
            {
                changeType: 'add',
                endLineNumber: 2,
                newContent: 'bar',
                startLineNumber: 2,
            },
        ];

        expect(consolidateLineChangeGroups(input)).toEqual(expected);
    });

    it('should handle multiple matching remove/add pairs', () => {
        const input: LineChangeGroup[] = [
            {
                changeType: 'remove',
                endLineNumber: 1,
                oldContent: 'foo',
                startLineNumber: 1,
            },
            {
                changeType: 'add',
                endLineNumber: 1,
                newContent: 'bar',
                startLineNumber: 1,
            },
            {
                changeType: 'remove',
                endLineNumber: 2,
                oldContent: 'baz',
                startLineNumber: 2,
            },
            {
                changeType: 'add',
                endLineNumber: 2,
                newContent: 'qux',
                startLineNumber: 2,
            },
        ];

        const expected: LineChangeGroup[] = [
            {
                changeType: 'replace',
                endLineNumber: 1,
                newContent: 'bar',
                oldContent: 'foo',
                startLineNumber: 1,
            },
            {
                changeType: 'replace',
                endLineNumber: 2,
                newContent: 'qux',
                oldContent: 'baz',
                startLineNumber: 2,
            },
        ];

        expect(consolidateLineChangeGroups(input)).toEqual(expected);
    });

    it('should handle non-matching changes', () => {
        const input: LineChangeGroup[] = [
            {
                changeType: 'remove',
                endLineNumber: 1,
                oldContent: 'foo',
                startLineNumber: 1,
            },
            {
                changeType: 'add',
                endLineNumber: 2,
                newContent: 'bar',
                startLineNumber: 2,
            },
            {
                changeType: 'remove',
                endLineNumber: 3,
                oldContent: 'baz',
                startLineNumber: 3,
            },
        ];

        const expected: LineChangeGroup[] = [
            {
                changeType: 'remove',
                endLineNumber: 1,
                oldContent: 'foo',
                startLineNumber: 1,
            },
            {
                changeType: 'add',
                endLineNumber: 2,
                newContent: 'bar',
                startLineNumber: 2,
            },
            {
                changeType: 'remove',
                endLineNumber: 3,
                oldContent: 'baz',
                startLineNumber: 3,
            },
        ];

        expect(consolidateLineChangeGroups(input)).toEqual(expected);
    });

    it('should handle empty input', () => {
        const input: LineChangeGroup[] = [];

        const expected: LineChangeGroup[] = [];

        expect(consolidateLineChangeGroups(input)).toEqual(expected);
    });

    it('should consolidate 6 file changes (flattened) into 3 replace operations with the expected content', () => {
        const fileChanges = [
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                isBinary: false,
                lineChangeGroups: [
                    {
                        changeType: 'remove',
                        endLineNumber: 2,
                        oldContent:
                            'COLORSET_COLOR\t\t196 0 38\t\t#\tCOLOR_PLAYER0   \t\t\t',
                        startLineNumber: 2,
                    },
                ],
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                isBinary: false,
                lineChangeGroups: [
                    {
                        changeType: 'add',
                        endLineNumber: 2,
                        newContent:
                            'COLORSET_COLOR\t\t32 32 32\t\t#\tCOLOR_PLAYER0   \t\t\t',
                        startLineNumber: 2,
                    },
                ],
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                isBinary: false,
                lineChangeGroups: [
                    {
                        changeType: 'remove',
                        endLineNumber: 3,
                        oldContent:
                            'COLORSET_COLOR\t\t138 59 204\t\t#\tCOLOR_PLAYER5   \t\t\t',
                        startLineNumber: 3,
                    },
                ],
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                isBinary: false,
                lineChangeGroups: [
                    {
                        changeType: 'add',
                        endLineNumber: 3,
                        newContent:
                            'COLORSET_COLOR\t\t200 0 0\t\t\t#\tCOLOR_PLAYER5   \t\t\t',
                        startLineNumber: 3,
                    },
                ],
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                isBinary: false,
                lineChangeGroups: [
                    {
                        changeType: 'remove',
                        endLineNumber: 4,
                        oldContent:
                            'COLORSET_COLOR\t\t137 98 53\t\t#\tCOLOR_PLAYER8   \t\t\t',
                        startLineNumber: 4,
                    },
                ],
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                isBinary: false,
                lineChangeGroups: [
                    {
                        changeType: 'add',
                        endLineNumber: 4,
                        newContent:
                            'COLORSET_COLOR\t\t255 255 64\t\t#\tCOLOR_PLAYER8   \t\t\t',
                        startLineNumber: 4,
                    },
                ],
            },
        ];

        // Flatten all line change groups into a single array
        const allLineChangeGroups = fileChanges.flatMap(
            (fc) => fc.lineChangeGroups as LineChangeGroup[]
        );

        const consolidated = consolidateLineChangeGroups(allLineChangeGroups);

        const expected = [
            {
                changeType: 'replace',
                endLineNumber: 2,
                newContent:
                    'COLORSET_COLOR\t\t32 32 32\t\t#\tCOLOR_PLAYER0   \t\t\t',
                oldContent:
                    'COLORSET_COLOR\t\t196 0 38\t\t#\tCOLOR_PLAYER0   \t\t\t',
                startLineNumber: 2,
            },
            {
                changeType: 'replace',
                endLineNumber: 3,
                newContent:
                    'COLORSET_COLOR\t\t200 0 0\t\t\t#\tCOLOR_PLAYER5   \t\t\t',
                oldContent:
                    'COLORSET_COLOR\t\t138 59 204\t\t#\tCOLOR_PLAYER5   \t\t\t',
                startLineNumber: 3,
            },
            {
                changeType: 'replace',
                endLineNumber: 4,
                newContent:
                    'COLORSET_COLOR\t\t255 255 64\t\t#\tCOLOR_PLAYER8   \t\t\t',
                oldContent:
                    'COLORSET_COLOR\t\t137 98 53\t\t#\tCOLOR_PLAYER8   \t\t\t',
                startLineNumber: 4,
            },
        ];

        // Ensure that we get 3 consolidated line change groups and all of them are "replace" types.
        expect(consolidated).toEqual(expected);
    });
});
describe('diffTexts', () => {
    it('should compute diff for small texts with a single line change', async () => {
        const text1 = 'Line1\nLine2\nLine3\n';
        const text2 = 'Line1\nChangedLine2\nLine3\n';
        const changes = await diffTexts(text1, text2);
        // Verify that there is one removed and one added change
        const removed = changes.filter((c) => c.removed);
        const added = changes.filter((c) => c.added);
        expect(removed.length).toBeGreaterThanOrEqual(1);
        expect(added.length).toBeGreaterThanOrEqual(1);
    });

    describe('diffTexts', () => {
        it('should compute diff for small texts with a single line change', async () => {
            const text1 = 'Line1\nLine2\nLine3\n';
            const text2 = 'Line1\nChangedLine2\nLine3\n';
            const changes = await diffTexts(text1, text2);
            // Verify that there is one removed and one added change
            const removed = changes.filter((c) => c.removed);
            const added = changes.filter((c) => c.added);
            expect(removed.length).toBeGreaterThanOrEqual(1);
            expect(added.length).toBeGreaterThanOrEqual(1);
        });

        it('should compute diff for large texts (between 20 and 40 KB each)', async () => {
            // Generate a large text with ~3000 lines (approx 30KB)
            const numLines = 3000;
            const baseLines = Array.from(
                { length: numLines },
                (_, i) => `Line ${i}`
            );
            const baseText = baseLines.join('\n') + '\n';

            // Create a modified version with one line changed in the middle
            const modifiedLines = [...baseLines];
            const changeIndex = Math.floor(numLines / 2);
            modifiedLines[changeIndex] =
                `Modified ${modifiedLines[changeIndex]}`;
            const modifiedText = modifiedLines.join('\n') + '\n';

            const changes = await diffTexts(baseText, modifiedText);

            // Instead of comparing the full diff output (which can be huge),
            // we simply check that there is at least one removed and one added chunk.
            const removed = changes.filter((c) => c.removed);
            const added = changes.filter((c) => c.added);
            expect(removed.length).toBeGreaterThanOrEqual(1);
            expect(added.length).toBeGreaterThanOrEqual(1);
        });

        it('should compute diff for very large texts (between 40 and 60 KB each)', async () => {
            // Generate a very large text with ~6000 lines (approx 60KB)
            const numLines = 6000;
            const baseLines = Array.from(
                { length: numLines },
                (_, i) => `Line ${i}`
            );
            const baseText = baseLines.join('\n') + '\n';

            // Create a modified version with one line changed in the middle
            const modifiedLines = [...baseLines];
            const changeIndex = Math.floor(numLines / 2);
            modifiedLines[changeIndex] =
                `Modified ${modifiedLines[changeIndex]}`;
            const modifiedText = modifiedLines.join('\n') + '\n';

            const changes = await diffTexts(baseText, modifiedText);

            // Instead of comparing the full diff output (which can be huge),
            // we simply check that there is at least one removed and one added chunk.
            const removed = changes.filter((c) => c.removed);
            const added = changes.filter((c) => c.added);
            expect(removed.length).toBeGreaterThanOrEqual(1);
            expect(added.length).toBeGreaterThanOrEqual(1);
        });

        it('should compute diff for small text with large text', async () => {
            const smallText = 'Line1\nLine2\nLine3\n';

            // Generate a large text with ~3000 lines (approx 30KB)
            const numLines = 3000;
            const baseLines = Array.from(
                { length: numLines },
                (_, i) => `Line ${i}`
            );
            const largeText = baseLines.join('\n') + '\n';

            const changes = await diffTexts(smallText, largeText);

            // Verify that there are added changes for the large text
            const added = changes.filter((c) => c.added);
            expect(added.length).toBeGreaterThanOrEqual(1);
        });

        it('should compute diff for large text with small text', async () => {
            const smallText = 'Line1\nLine2\nLine3\n';

            // Generate a large text with ~3000 lines (approx 30KB)
            const numLines = 3000;
            const baseLines = Array.from(
                { length: numLines },
                (_, i) => `Line ${i}`
            );
            const largeText = baseLines.join('\n') + '\n';

            const changes = await diffTexts(largeText, smallText);

            // Verify that there are removed changes for the large text
            const removed = changes.filter((c) => c.removed);
            expect(removed.length).toBeGreaterThanOrEqual(1);
        });

        it('should compute diff for texts with different sizes', async () => {
            // Generate a medium text with ~1500 lines (approx 15KB)
            const numLinesMedium = 1500;
            const baseLinesMedium = Array.from(
                { length: numLinesMedium },
                (_, i) => `Line ${i}`
            );
            const mediumText = baseLinesMedium.join('\n') + '\n';

            // Generate a large text with ~3000 lines (approx 30KB)
            const numLinesLarge = 3000;
            const baseLinesLarge = Array.from(
                { length: numLinesLarge },
                (_, i) => `Line ${i}`
            );
            const largeText = baseLinesLarge.join('\n') + '\n';

            const changes = await diffTexts(mediumText, largeText);

            // Verify that there are added changes for the large text
            const added = changes.filter((c) => c.added);
            expect(added.length).toBeGreaterThanOrEqual(1);
        });
    });
    describe('splitIntoChunks', () => {
        it('should split text into chunks of specified size', () => {
            const text = 'Line1\nLine2\nLine3\nLine4\nLine5\n';
            const chunks = splitIntoChunks(text);
            expect(chunks.length).toBeGreaterThan(0);
            expect(chunks.every((chunk) => chunk.length <= CHUNK_SIZE)).toBeTruthy(
                
            );
        });

        it('should handle text smaller than chunk size', () => {
            const text = 'Line1\nLine2\n';
            const chunks = splitIntoChunks(text);
            expect(chunks).toHaveLength(1);
            expect(chunks[0]).toBe(text + '\n');
        });

        it('should handle text exactly equal to chunk size', () => {
            const text = 'A'.repeat(CHUNK_SIZE);
            const chunks = splitIntoChunks(text);
            expect(chunks).toHaveLength(1);
            expect(chunks[0]).toBe(text);
        });

        it('should handle text larger than chunk size', () => {
            // Create text with multiple lines that exceeds the chunk size
            const lineSize = 100; // Size of each line
            const linesInFirstChunk = Math.floor(CHUNK_SIZE / (lineSize + 1)); // +1 for newline
            const totalLines = linesInFirstChunk + 5; // Add some extra lines for second chunk

            const lines = Array.from({ length: totalLines }, (_, i) =>
                'A'.repeat(lineSize)
            );
            const text = lines.join('\n');

            const chunks = splitIntoChunks(text);
            expect(chunks).toHaveLength(2);
            expect(chunks[0].length).toBeLessThanOrEqual(CHUNK_SIZE);
            expect(chunks[1].length).toBeGreaterThan(0);
        });
    });

    describe('diffTexts', () => {
        it('should compute diff for small texts with a single line change', async () => {
            const text1 = 'Line1\nLine2\nLine3\n';
            const text2 = 'Line1\nChangedLine2\nLine3\n';
            const changes = await diffTexts(text1, text2);
            const removed = changes.filter((c) => c.removed);
            const added = changes.filter((c) => c.added);
            expect(removed.length).toBeGreaterThanOrEqual(1);
            expect(added.length).toBeGreaterThanOrEqual(1);
        });

        it('should compute diff for large texts (between 20 and 40 KB each)', async () => {
            const numLines = 3000;
            const baseLines = Array.from(
                { length: numLines },
                (_, i) => `Line ${i}`
            );
            const baseText = baseLines.join('\n') + '\n';
            const modifiedLines = [...baseLines];
            const changeIndex = Math.floor(numLines / 2);
            modifiedLines[changeIndex] =
                `Modified ${modifiedLines[changeIndex]}`;
            const modifiedText = modifiedLines.join('\n') + '\n';
            const changes = await diffTexts(baseText, modifiedText);
            const removed = changes.filter((c) => c.removed);
            const added = changes.filter((c) => c.added);
            expect(removed.length).toBeGreaterThanOrEqual(1);
            expect(added.length).toBeGreaterThanOrEqual(1);
        });

        it('should compute diff for very large texts (between 40 and 60 KB each)', async () => {
            const numLines = 6000;
            const baseLines = Array.from(
                { length: numLines },
                (_, i) => `Line ${i}`
            );
            const baseText = baseLines.join('\n') + '\n';
            const modifiedLines = [...baseLines];
            const changeIndex = Math.floor(numLines / 2);
            modifiedLines[changeIndex] =
                `Modified ${modifiedLines[changeIndex]}`;
            const modifiedText = modifiedLines.join('\n') + '\n';
            const changes = await diffTexts(baseText, modifiedText);
            const removed = changes.filter((c) => c.removed);
            const added = changes.filter((c) => c.added);
            expect(removed.length).toBeGreaterThanOrEqual(1);
            expect(added.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('getFileChangesToApplyMod', () => {
        it('should return an empty array if the mod directory does not exist', async () => {
            vi.spyOn(fs, 'statSync').mockImplementation(() => {
                throw new Error('Directory does not exist');
            });
            const changes = await getFileChangesToApplyMod(
                'nonexistent-mod',
                '/install/dir'
            );
            expect(changes).toEqual([]);
        });

        it('should return an empty array if the mod path is not a directory', async () => {
            vi.spyOn(fs, 'statSync').mockReturnValue({
                isDirectory: () => false,
            } as fs.Stats);
            const changes = await getFileChangesToApplyMod(
                'not-a-directory',
                '/install/dir'
            );
            expect(changes).toEqual([]);
        });
        it('should return an empty array if the mod directory does not exist', async () => {
            vi.spyOn(fs, 'statSync').mockImplementation(() => {
                throw new Error('Directory does not exist');
            });
            const changes = await getFileChangesToApplyMod(
                'nonexistent-mod',
                '/install/dir'
            );
            expect(changes).toEqual([]);
        });

        it('should return an empty array if the mod path is not a directory', async () => {
            vi.spyOn(fs, 'statSync').mockReturnValue({
                isDirectory: () => false,
            } as fs.Stats);
            const changes = await getFileChangesToApplyMod(
                'not-a-directory',
                '/install/dir'
            );
            expect(changes).toEqual([]);
        });

        it('should handle empty mod directory', async () => {
            vi.spyOn(fs, 'statSync').mockReturnValue({
                isDirectory: () => true,
            } as fs.Stats);
            vi.spyOn(fs, 'readdirSync').mockReturnValue([]);

            const changes = await getFileChangesToApplyMod(
                'empty-mod',
                '/install/dir'
            );
            expect(changes).toEqual([]);
        });
    });
});
