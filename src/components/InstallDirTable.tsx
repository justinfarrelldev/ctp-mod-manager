/*
    Holds a table which displays the user-specified installation directories
*/

import { Folder, BuildCircle, PlayCircle, Delete } from '@mui/icons-material';
import { Grid, Tooltip, Button, Typography } from '@mui/material';
import React, { FC, useState } from 'react';
import { ElectronWindow, InstallDirectory } from '../App';
import { Modal } from './Modal';

interface Props {
  installDirs: InstallDirectory[];
  onClickModify: (dirPathBeingModified: string) => void;
  onAddedInstallDirectory: () => void;
}

const openInstallDir = (dir: string): void => {
  console.log('opening install dir: ', dir);
  (window as ElectronWindow).api.openInstallDir('file:openInstallDir', dir);
};

const addToInstallDirs = async (dir: string): Promise<void> => {
  await (window as ElectronWindow).api.addToInstallDirs('file:addToInstallDirs', dir);
};

const removeFromInstallDirs = async (dir: string): Promise<void> => {
  await (window as ElectronWindow).api.removeFromInstallDirs('file:removeFromInstallDirs', dir);
};

export const InstallDirTable: FC<Props> = ({
  installDirs,
  onClickModify,
  onAddedInstallDirectory,
}) => {
  const [deletePopupOpen, setDeletePopupOpen] = useState<string>('');

  const addInstall = async () => {
    const folder = await (window as ElectronWindow).api.selectFolder('file:selectFolder');
    const isValidInstall = await (window as ElectronWindow).api.isValidInstall(
      'file:isValidInstall',
      folder
    );

    if (isValidInstall) {
      console.log('This is a valid install');
      addToInstallDirs(folder);
      onAddedInstallDirectory();
    } else {
      console.error('Invalid install! Inform the user here!');
    }
  };

  const removeInstall = async (dir: string) => {
    removeFromInstallDirs(dir);
    onAddedInstallDirectory();
  };

  const runGame = (dir: string) => {
    (window as ElectronWindow).api.runGame('file:runGame', `${dir}\\ctp2_program\\ctp\\ctp2.exe`);
  };
  return (
    <>
      {installDirs.length === 0 && (
        <Typography>No installation directories have been added yet. Add one now?</Typography>
      )}

      {installDirs.map((dir) => (
        <div key={dir.directory}>
          {deletePopupOpen && (
            <Modal width="50%" open={deletePopupOpen !== ''} onClose={() => setDeletePopupOpen('')}>
              <>
                <Typography variant="h3">Are you sure?</Typography>
                <Typography>{`This will remove the installation from the "installations" list in the mod manager, but it will not delete any actual files.`}</Typography>
                <br></br>
                <Grid container>
                  <Grid item xs={6}>
                    <Button
                      onClick={() => {
                        removeInstall(deletePopupOpen);
                        setDeletePopupOpen('');
                      }}
                    >
                      Yes, do it!
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button onClick={() => setDeletePopupOpen('')}>No</Button>
                  </Grid>
                </Grid>
              </>
            </Modal>
          )}
          <Grid container key={`${dir.os}${dir.installationType}${dir.directory}`}>
            <Grid item xs={6}>
              <Tooltip title="View files">
                <span>
                  <Button onClick={() => openInstallDir(dir.directory)}>
                    <Folder />
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Modify game">
                <span>
                  <Button
                    onClick={() => {
                      onClickModify(dir.directory);
                    }}
                  >
                    <BuildCircle />
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Remove this installation from the list (this will not delete the installation, rather it will just remove it graphically from this view)">
                <span>
                  <Button
                    onClick={() => {
                      setDeletePopupOpen(dir.directory);
                    }}
                  >
                    <Delete />
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Run game">
                <span>
                  <Button
                    onClick={() => {
                      //onClickModify(dir.directory);
                      runGame(dir.directory);
                    }}
                  >
                    <PlayCircle />
                  </Button>
                </span>
              </Tooltip>
            </Grid>

            <Grid item xs={6}>
              <Typography sx={{ color: 'green' }}>{`[${dir.installationType.toUpperCase()}] ${
                dir.directory
              }`}</Typography>
            </Grid>
          </Grid>
        </div>
      ))}
      <Tooltip title="Add an Installation of Call to Power II">
        <Button onClick={() => addInstall()}>Add Installation</Button>
      </Tooltip>
    </>
  );
};
