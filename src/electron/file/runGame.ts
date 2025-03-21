import { spawn } from 'child_process';
import { access, constants } from 'fs';
import { platform } from 'os';
import { ReadonlyDeep } from 'type-fest';

export const runGame = (exeDir: string): void => {
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

        const game = spawn(exeDir, [], { shell: platform() === 'win32' });

        game.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        game.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        game.on('close', (code) => {
            console.log(`Game process exited with code ${code}`);
        });

        game.on('error', (err) => {
            console.error(`Failed to start process: ${err}`);
        });
    });
};
