import { execFileSync } from 'child_process';

export const runGame = (exeDir: string): void => {
    console.log('executing exe: ', exeDir);
    execFileSync(exeDir, []);
};
