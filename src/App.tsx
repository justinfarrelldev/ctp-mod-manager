import React, { FC, useState, useEffect } from 'react';
import { Modal, Typography, Box } from '@mui/material';

export const App: FC = (): React.ReactElement => {
  const [loaded, setLoaded] = useState<boolean>();
  const [installDirModalOpen, setInstallDirModalOpen] = useState<boolean>(true);

  const load = (): void => {
    console.log('Sending the message');
    // TODO define this type such that the types are shared between
    // Electron and React
    window.api.send('SEND_CTP2_INSTALL_DIR');
    setLoaded(true);
  };

  const handleInstallDirModalClose = (): void => {
    setInstallDirModalOpen(false);
  };

  useEffect(() => {
    if (!loaded) load();
  }, []);

  return (
    <>
      <Typography variant="h3">Call to Power Mod Manager</Typography>

      <Modal open={installDirModalOpen} onClose={handleInstallDirModalClose}>
        <Box>
          <Typography>
            Call to Power Mod Manager would like to auto-detect current installations of
            Civilization: Call to Power and Call to Power II. This will NOT install any mods on
            either of them. Is this okay?
          </Typography>
        </Box>
      </Modal>
    </>
  );
};
