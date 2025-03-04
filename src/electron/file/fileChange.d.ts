import { LineChangeGroup } from './lineChangeGroup';

export type BinaryFileChange = {
    fileName: string;
    isBinary: true;
};

// Wish there was a way to share this type, but alas... it's also found in App.tsx
export type FileChange = BinaryFileChange | TextFileChange;

export type TextFileChange = {
    fileName: string;
    isBinary?: false;
    lineChangeGroups: LineChangeGroup[];
};
