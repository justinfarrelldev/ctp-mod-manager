import { MenuItem, Select, Typography } from '@mui/material';
import React, { FC } from 'react';

export const Settings: FC = (): React.ReactElement => {
  return (
    <>
      <Typography>General Settings</Typography>
      <Select label="Theme" defaultValue="light">
        <MenuItem value="light">Light</MenuItem>
        <MenuItem value="cafe">Cafe</MenuItem>
        <MenuItem value="dark">Dark</MenuItem>
        <MenuItem value="tokyo-night">Tokyo Night</MenuItem>
        <MenuItem value="amoled">Amoled</MenuItem>
      </Select>
    </>
  );
};
