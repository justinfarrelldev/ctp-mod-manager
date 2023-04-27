import React, { FC, useState, useEffect } from 'react';
import { Typography } from '@mui/material';

export const App: FC = (): React.ReactElement => {
  const [loaded, setLoaded] = useState<boolean>();

  const load = (): void => {
    console.log('Sending the message');
    // TODO define this type such that the types are shared between
    // Electron and React
    window.api.send('SEND_CTP2_INSTALL_DIR');
    setLoaded(true);
  };

  useEffect(() => {
    if (!loaded) load();
  }, []);

  return <Typography variant="h3">Call to Power Mod Manager</Typography>;
};
