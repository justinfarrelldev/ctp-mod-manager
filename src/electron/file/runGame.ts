import { ChildProcess, spawn } from 'child_process';
import { access, constants } from 'fs';
import { platform } from 'os';
import { ReadonlyDeep } from 'type-fest';

import { GAME_EXECUTABLES } from './ctpVariants';

// Track the running game process
let gameProcess: ChildProcess | null = null;
// Track which installation directory is running
let runningGameDir: null | string = null;

export const isGameRunning = (exeDir?: string): boolean => {
    // If exeDir is provided, check if that specific game is running
    if (exeDir && runningGameDir !== exeDir) {
        return false;
    }
    return gameProcess !== null;
};

export const stopGame = (): boolean => {
    if (gameProcess) {
        console.log('Stopping game process');
        console.log('game process: ', gameProcess);

        if (platform() === 'win32') {
            // Support both ctp2.exe and civctp.exe
            for (const exe of GAME_EXECUTABLES) {
                const taskkill = spawn('taskkill', ['/f', '/im', exe], {
                    shell: true,
                });

                taskkill.stdout.on('data', (data) => {
                    console.log(`taskkill stdout: ${data}`);
                });

                taskkill.stderr.on('data', (data) => {
                    console.error(`taskkill stderr: ${data}`);
                });

                taskkill.on('close', (code) => {
                    if (code === 0) {
                        console.log(
                            `Successfully killed process ${exe} using taskkill`
                        );
                        gameProcess = null;
                        runningGameDir = null;
                    }
                });
            }
            return true;
        } else {
            // Try to gracefully kill the process on non-Windows systems
            const killed = gameProcess.kill();

            if (killed) {
                gameProcess = null;
                runningGameDir = null;
                console.log('Successfully killed!');
                return true;
            } else {
                console.error('Failed to kill game process');
                return false;
            }
        }
    }
    return false;
};

export const runGame = (exeDir: string): void => {
    // If a game is already running, don't start another
    if (isGameRunning()) {
        console.log('A game is already running, please stop it first');
        return;
    }

    console.log('executing exe: ', exeDir);

    const checkPermissions = (
        callback: (err: ReadonlyDeep<NodeJS.ErrnoException | null>) => void
    ): void => {
        if (platform() === 'win32') {
            // On Windows, just check if the file exists
            access(exeDir, constants.F_OK, callback);
        } else {
            // On Unix-like systems, check if the file is executable
            access(exeDir, constants.X_OK, callback);
        }
    };

    checkPermissions((err) => {
        if (err) {
            console.error(
                `No access or execute permission for ${exeDir}:`,
                err
            );
            return;
        }

        const game = spawn(`"${exeDir}"`, [], {
            shell: platform() === 'win32',
        });

        // Store the process reference
        gameProcess = game;
        runningGameDir = exeDir;

        game.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        game.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        game.on('close', (code) => {
            console.log(`Game process exited with code ${code}`);
            gameProcess = null;
            runningGameDir = null;
        });

        game.on('error', (err) => {
            console.error(`Failed to start process: ${err}`);
            gameProcess = null;
            runningGameDir = null;
        });
    });
};
