import { Grid, MenuItem, Select, TextField, Typography } from '@mui/material';
import React, { FC, useState } from 'react';
import Cookie from 'js-cookie';

// TODO finish this after configuring the proper locations within the Electron-side

const MOD_STORAGE_DIR_COOKIE_NAME = 'modStorageDirectory';
const INITIAL_MOD_STORAGE_DIR = ''; // TODO eventually replace this with Linux and Mac as well

const initialModStorageCookie =
  Cookie.get(MOD_STORAGE_DIR_COOKIE_NAME) === undefined
    ? ''
    : Cookie.get(MOD_STORAGE_DIR_COOKIE_NAME);

export const Settings: FC = (): React.ReactElement => {
  const [modStorageDirectory, setModStorageDirectory] = useState<string>();

  return (
    <>
      <Typography>General Settings</Typography>
      <Grid container>
        <Grid item xs={12} paddingBottom={4}>
          <Select label="Theme" defaultValue="light">
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="cafe">Cafe</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
            <MenuItem value="tokyo-night">Tokyo Night</MenuItem>
            <MenuItem value="amoled">Amoled</MenuItem>
          </Select>
        </Grid>
        <Grid item>
          <TextField variant="outlined" label="Mod Storage Directory"></TextField>
        </Grid>
      </Grid>
    </>
  );
};
