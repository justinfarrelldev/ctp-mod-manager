import React, { FC, useState } from 'react';
import { Typography, Box, Grid, CircularProgress as Loader } from '@mui/material';
import { Folder } from '@mui/icons-material';
import { Modal } from './components/Modal';
import { Button } from './components/Button';

type ElectronWindow = Window &
  typeof globalThis & {
    api: {
      getCtp2InstallDir: () => Promise<
        [
          {
            directory: string;
            installationType: 'steam' | 'gog';
            os: string;
          }
        ]
      >;
      openInstallDir: (ipcCommand: string, dir: string) => void;
    };
  };

type InstallDirectory = {
  os: string;
  directory: string;
  installationType: 'steam' | 'gog';
};

export const App: FC = (): React.ReactElement => {
  const [loadingDirs, setLoadingDirs] = useState<boolean>();
  const [installDirModalOpen, setInstallDirModalOpen] = useState<boolean>(true);
  const [installDirs, setInstallDirs] = useState<InstallDirectory[]>([]);

  const findInstallDirs = async (): Promise<void> => {
    setLoadingDirs(true);
    const dirs = await (window as ElectronWindow).api.getCtp2InstallDir();

    setInstallDirs(dirs);
    setLoadingDirs(false);
  };

  const openInstallDir = (dir: string): void => {
    console.log('opening install dir: ', dir);
    (window as ElectronWindow).api.openInstallDir('file:openInstallDir', dir);
  };

  const handleInstallDirModalClose = (): void => {
    setInstallDirModalOpen(false);
  };

  return (
    <>
      <Typography variant="h3">Call to Power Mod Manager</Typography>
      <Typography variant="h4">Call to Power 2 Installations</Typography>

      {loadingDirs && <Loader />}
      {installDirs.length ? (
        installDirs.map((dir) => (
          <Grid container key={`${dir.os}${dir.installationType}${dir.directory}`}>
            <Grid item xs={6}>
              <Button onClick={() => openInstallDir(dir.directory)}>
                <Folder />
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ color: 'green' }}>{`[${dir.installationType.toUpperCase()}] ${
                dir.directory
              }`}</Typography>
            </Grid>
          </Grid>
        ))
      ) : (
        <Typography>No installation directories have been added yet. Add one now?</Typography>
      )}
      <Modal width="50%" open={installDirModalOpen} onClose={handleInstallDirModalClose}>
        <Box>
          <Grid container rowSpacing="1rem">
            <Grid item xs={12}>
              <Typography variant="h4" textAlign="center">
                Call to Power Mod Manager would like to auto-detect current installations of
                Civilization: Call to Power and Call to Power II. This will NOT install any mods on
                either of them. Is this okay?
              </Typography>
            </Grid>
            <Grid item xs={6} textAlign="center">
              <Button
                onClick={() => {
                  findInstallDirs();
                  handleInstallDirModalClose();
                }}
                variant="outlined"
              >
                Yes
              </Button>
            </Grid>
            <Grid item xs={6} textAlign="center">
              <Button
                onClick={() => {
                  handleInstallDirModalClose();
                }}
                variant="outlined"
              >
                No
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
};
