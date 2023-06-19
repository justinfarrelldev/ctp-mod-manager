import React, { FC, useState } from 'react';
import { Typography, Box, Grid, CircularProgress as Loader, Tooltip, Button } from '@mui/material';
import { Folder, BuildCircle } from '@mui/icons-material';
import { Modal } from './components/Modal';

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
      copyFiles: (ipcCommand: string, fileDir: string, fileDest: string) => void;
      goToRoute: (ipcCommand: string, route: string) => void;
    };
  };

export type InstallDirectory = {
  os: string;
  directory: string;
  installationType: 'steam' | 'gog';
};

export const App: FC = (): React.ReactElement => {
  const [loadingDirs, setLoadingDirs] = useState<boolean>();
  const [installDirModalOpen, setInstallDirModalOpen] = useState<boolean>(true);
  const [installDirs, setInstallDirs] = useState<InstallDirectory[]>([]);
  const [dirBeingModified, setDirBeingModified] = useState<string>('');

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

  const goToRoute = (route: string): void => {
    console.log('going to a route: ', route);
    (window as ElectronWindow).api.goToRoute('process:goToRoute', route);
  };

  const handleInstallDirModalClose = (): void => {
    setInstallDirModalOpen(false);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files);
    console.log('files:', files);
    (window as ElectronWindow).api.copyFiles(
      'file:copy',
      (files[0] as File & { path: string }).path,
      '/test'
    );
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
                      setDirBeingModified(dir.directory);
                    }}
                  >
                    <BuildCircle />
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
        ))
      ) : (
        <Typography>No installation directories have been added yet. Add one now?</Typography>
      )}
      <Modal
        open={dirBeingModified !== ''}
        onClose={() => {
          setDirBeingModified('');
        }}
        width="50%"
      >
        <Box>
          <Typography variant="h4">{`Modify ${dirBeingModified}`}</Typography>
          <Grid container>
            <Grid item xs={6}>
              <Grid container>
                <Grid item xs={12}>
                  <Typography variant="h6">Mod List</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Tooltip title="Add a mod to the mod list (this simply adds the mod to your mod storage directory)">
                    <div>
                      <input
                        onChange={handleFileSelected}
                        accept=".zip"
                        id="add-mod-button"
                        type="file"
                        hidden
                      />
                      <label htmlFor="add-mod-button">
                        <Button component="span">Add a Mod</Button>
                      </label>
                    </div>
                  </Tooltip>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={6}>
              <Grid container>
                <Typography variant="h6">Mods Applied</Typography>
              </Grid>
            </Grid>
            <Grid item xs={6}>
              <Grid container>
                <Typography variant="h6">Files Changed by Mods</Typography>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Modal>
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
