export type LineChangeGroupAdd = {
    startLineNumber: number;
    endLineNumber: number;
    newContent: string;
    changeType: 'add';
};

export type LineChangeGroupRemove = {
    startLineNumber: number;
    endLineNumber: number;
    oldContent: string;
    changeType: 'remove';
};

export type LineChangeGroupReplace = {
    startLineNumber: number;
    endLineNumber: number;
    newContent: string;
    oldContent: string;
    changeType: 'replace';
};

// Wish there was a way to share this type, but alas... it's also found in App.tsx
export type LineChangeGroup =
    | LineChangeGroupAdd
    | LineChangeGroupRemove
    | LineChangeGroupReplace;
