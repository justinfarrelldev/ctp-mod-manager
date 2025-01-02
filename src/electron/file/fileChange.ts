import { LineChangeGroup } from './lineChangeGroup';

export type TextFileChange = {
    fileName: string;
    lineChangeGroups: LineChangeGroup[];
    isBinary?: false;
};

export type BinaryFileChange = {
    fileName: string;
    isBinary: true;
};

// Wish there was a way to share this type, but alas... it's also found in App.tsx
export type FileChange = TextFileChange | BinaryFileChange;
