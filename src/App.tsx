import React, { FC, useState, useEffect } from 'react';
import { Typography } from '@mui/material';

const { ipcRenderer } = window.require('electron');

export const App: FC = (): React.ReactElement => {
  const [loaded, setLoaded] = useState<boolean>();

  const load = (): void => {
    ipcRenderer.send('GET_CTP2_INSTALL_DIR');
    setLoaded(true);
  };

  useEffect(() => {
    if (!loaded) load();
  }, []);

  return <Typography variant="h3">Call to Power Mod Manager</Typography>;
};
