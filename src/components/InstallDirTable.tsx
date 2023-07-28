/*
    Holds a table which displays the user-specified installation directories
*/

import { Folder, BuildCircle, PlayCircle } from '@mui/icons-material';
import { Grid, Tooltip, Button, Typography } from '@mui/material';
import React, { FC } from 'react';
import { ElectronWindow, InstallDirectory } from '../App';

interface Props {
  installDirs: InstallDirectory[];
  onClickModify: (dirPathBeingModified: string) => void;
}

const openInstallDir = (dir: string): void => {
  console.log('opening install dir: ', dir);
  (window as ElectronWindow).api.openInstallDir('file:openInstallDir', dir);
};

export const InstallDirTable: FC<Props> = ({ installDirs, onClickModify }) => {
  return (
    <>
      {installDirs.length === 0 && (
        <Typography>No installation directories have been added yet. Add one now?</Typography>
      )}
      {installDirs.map((dir) => (
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
            <Tooltip title="Run game">
              <span>
              <Button
                  onClick={() => {
                    //onClickModify(dir.directory);
                    alert('Would launch game')
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
      ))}
    </>
  );
};
