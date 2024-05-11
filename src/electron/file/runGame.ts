import { spawn } from 'child_process';

export const runGame = (exeDir: string): void => {
    console.log('executing exe: ', exeDir);

    const game = spawn(exeDir, []);

    game.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    game.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    game.on('close', (code) => {
        console.log(`Game process exited with code ${code}`);
    });
};
