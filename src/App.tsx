import React, { FC, useState, useEffect } from 'react';
import { Typography, Box, Grid, CircularProgress as Loader } from '@mui/material';
import { Modal } from './components/Modal';
import { Button } from './components/Button';

type InstallDirectory = {
  os: string;
  directory: string;
  installationType: 'steam' | 'gog';
};

export const App: FC = (): React.ReactElement => {
  const [loaded, setLoaded] = useState<boolean>();
  const [loadingDirs, setLoadingDirs] = useState<boolean>();
  const [installDirModalOpen, setInstallDirModalOpen] = useState<boolean>(true);
  const [installDirs, setInstallDirs] = useState<InstallDirectory[]>([]);

  const findInstallDirs = async (): Promise<void> => {
    setLoadingDirs(true);
    const dirs = await window.api.getCtp2InstallDir();

    setLoaded(true);
    setInstallDirs(dirs);
    setLoadingDirs(false);
  };

  const handleInstallDirModalClose = (): void => {
    setInstallDirModalOpen(false);
  };

  return (
    <>
      <Typography variant="h3">Call to Power Mod Manager</Typography>
      {loadingDirs && <Loader />}
      {installDirs.length && <Typography variant="h4">Call to Power 2 Installations</Typography>}
      {installDirs.map((dir) => (
        <Typography
          key={`${dir.os}${dir.installationType}${dir.directory}`}
          sx={{ color: 'green' }}
        >{`[${dir.installationType.toUpperCase()}] ${dir.directory}`}</Typography>
      ))}

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
