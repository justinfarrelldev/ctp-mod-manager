// Wish there was a way to share this type, but alas... it's also found in App.tsx
export type LineChangeGroup =
    | LineChangeGroupAdd
    | LineChangeGroupRemove
    | LineChangeGroupReplace;

export type LineChangeGroupAdd = {
    changeType: 'add';
    endLineNumber: number;
    newContent: string;
    startLineNumber: number;
};

export type LineChangeGroupRemove = {
    changeType: 'remove';
    endLineNumber: number;
    oldContent: string;
    startLineNumber: number;
};

export type LineChangeGroupReplace = {
    changeType: 'replace';
    endLineNumber: number;
    newContent: string;
    oldContent: string;
    startLineNumber: number;
};
