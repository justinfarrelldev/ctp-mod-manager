import { describe, it, expect, vi } from 'vitest';
import { consolidateLineChangeGroups } from './getFileChangesToApplyMod';
import { LineChangeGroup } from './lineChangeGroup';
import { diffTexts } from './getFileChangesToApplyMod';

vi.mock('electron', () => ({
    app: {
        getPath: vi.fn().mockReturnValue('/mock/path'),
        getName: vi.fn().mockReturnValue('mock-name'),
    },
}));

describe('consolidateLineChangeGroups', () => {
    it('should consolidate matching remove/add pairs into replace operations', () => {
        const input: LineChangeGroup[] = [
            {
                changeType: 'remove',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
            },
            {
                changeType: 'add',
                startLineNumber: 1,
                endLineNumber: 1,
                newContent: 'bar',
            },
        ];

        const expected: LineChangeGroup[] = [
            {
                changeType: 'replace',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
                newContent: 'bar',
            },
        ];

        expect(consolidateLineChangeGroups(input)).toEqual(expected);
    });

    it('should not consolidate non-matching remove/add pairs', () => {
        const input: LineChangeGroup[] = [
            {
                changeType: 'remove',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
            },
            {
                changeType: 'add',
                startLineNumber: 2,
                endLineNumber: 2,
                newContent: 'bar',
            },
        ];

        const expected: LineChangeGroup[] = [
            {
                changeType: 'remove',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
            },
            {
                changeType: 'add',
                startLineNumber: 2,
                endLineNumber: 2,
                newContent: 'bar',
            },
        ];

        expect(consolidateLineChangeGroups(input)).toEqual(expected);
    });

    it('should handle multiple matching remove/add pairs', () => {
        const input: LineChangeGroup[] = [
            {
                changeType: 'remove',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
            },
            {
                changeType: 'add',
                startLineNumber: 1,
                endLineNumber: 1,
                newContent: 'bar',
            },
            {
                changeType: 'remove',
                startLineNumber: 2,
                endLineNumber: 2,
                oldContent: 'baz',
            },
            {
                changeType: 'add',
                startLineNumber: 2,
                endLineNumber: 2,
                newContent: 'qux',
            },
        ];

        const expected: LineChangeGroup[] = [
            {
                changeType: 'replace',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
                newContent: 'bar',
            },
            {
                changeType: 'replace',
                startLineNumber: 2,
                endLineNumber: 2,
                oldContent: 'baz',
                newContent: 'qux',
            },
        ];

        expect(consolidateLineChangeGroups(input)).toEqual(expected);
    });

    it('should handle non-matching changes', () => {
        const input: LineChangeGroup[] = [
            {
                changeType: 'remove',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
            },
            {
                changeType: 'add',
                startLineNumber: 2,
                endLineNumber: 2,
                newContent: 'bar',
            },
            {
                changeType: 'remove',
                startLineNumber: 3,
                endLineNumber: 3,
                oldContent: 'baz',
            },
        ];

        const expected: LineChangeGroup[] = [
            {
                changeType: 'remove',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
            },
            {
                changeType: 'add',
                startLineNumber: 2,
                endLineNumber: 2,
                newContent: 'bar',
            },
            {
                changeType: 'remove',
                startLineNumber: 3,
                endLineNumber: 3,
                oldContent: 'baz',
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
                lineChangeGroups: [
                    {
                        startLineNumber: 2,
                        endLineNumber: 2,
                        changeType: 'remove',
                        oldContent:
                            'COLORSET_COLOR\t\t196 0 38\t\t#\tCOLOR_PLAYER0   \t\t\t',
                    },
                ],
                isBinary: false,
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                lineChangeGroups: [
                    {
                        startLineNumber: 2,
                        endLineNumber: 2,
                        changeType: 'add',
                        newContent:
                            'COLORSET_COLOR\t\t32 32 32\t\t#\tCOLOR_PLAYER0   \t\t\t',
                    },
                ],
                isBinary: false,
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                lineChangeGroups: [
                    {
                        startLineNumber: 3,
                        endLineNumber: 3,
                        changeType: 'remove',
                        oldContent:
                            'COLORSET_COLOR\t\t138 59 204\t\t#\tCOLOR_PLAYER5   \t\t\t',
                    },
                ],
                isBinary: false,
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                lineChangeGroups: [
                    {
                        startLineNumber: 3,
                        endLineNumber: 3,
                        changeType: 'add',
                        newContent:
                            'COLORSET_COLOR\t\t200 0 0\t\t\t#\tCOLOR_PLAYER5   \t\t\t',
                    },
                ],
                isBinary: false,
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                lineChangeGroups: [
                    {
                        startLineNumber: 4,
                        endLineNumber: 4,
                        changeType: 'remove',
                        oldContent:
                            'COLORSET_COLOR\t\t137 98 53\t\t#\tCOLOR_PLAYER8   \t\t\t',
                    },
                ],
                isBinary: false,
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                lineChangeGroups: [
                    {
                        startLineNumber: 4,
                        endLineNumber: 4,
                        changeType: 'add',
                        newContent:
                            'COLORSET_COLOR\t\t255 255 64\t\t#\tCOLOR_PLAYER8   \t\t\t',
                    },
                ],
                isBinary: false,
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
                startLineNumber: 2,
                endLineNumber: 2,
                oldContent:
                    'COLORSET_COLOR\t\t196 0 38\t\t#\tCOLOR_PLAYER0   \t\t\t',
                newContent:
                    'COLORSET_COLOR\t\t32 32 32\t\t#\tCOLOR_PLAYER0   \t\t\t',
            },
            {
                changeType: 'replace',
                startLineNumber: 3,
                endLineNumber: 3,
                oldContent:
                    'COLORSET_COLOR\t\t138 59 204\t\t#\tCOLOR_PLAYER5   \t\t\t',
                newContent:
                    'COLORSET_COLOR\t\t200 0 0\t\t\t#\tCOLOR_PLAYER5   \t\t\t',
            },
            {
                changeType: 'replace',
                startLineNumber: 4,
                endLineNumber: 4,
                oldContent:
                    'COLORSET_COLOR\t\t137 98 53\t\t#\tCOLOR_PLAYER8   \t\t\t',
                newContent:
                    'COLORSET_COLOR\t\t255 255 64\t\t#\tCOLOR_PLAYER8   \t\t\t',
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
});
