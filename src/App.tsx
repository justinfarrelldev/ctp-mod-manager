import React, { FC, useState, useEffect } from 'react';
import { Typography, Box, Grid } from '@mui/material';
import { Modal } from './components/Modal';
import { Button } from './components/Button';

export const App: FC = (): React.ReactElement => {
  const [loaded, setLoaded] = useState<boolean>();
  const [installDirModalOpen, setInstallDirModalOpen] = useState<boolean>(true);

  const findInstallDirs = async (): Promise<void> => {
    console.log('Sending the message');
    const dirs = window.api.getCtp2InstallDir();
    setLoaded(true);
    return dirs;
  };

  const handleInstallDirModalClose = (): void => {
    setInstallDirModalOpen(false);
  };

  return (
    <>
      <Typography variant="h3">Call to Power Mod Manager</Typography>

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
                onClick={async () => {
                  const dirs = await findInstallDirs();
                  console.log('dirs found: ', dirs);
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
