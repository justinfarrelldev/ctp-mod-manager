import { Box, Button, Typography, Grid, Tooltip } from '@mui/material';
import React, { FC } from 'react';
import { viewFileDirsInZip } from '../electron/file/viewFilesInZip';

type Props = {
  onBackClicked: () => void;
  dirBeingModified: string;
  onModSelected: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onQueueMod: (modName: string) => Promise<void>;
  onDequeueMod: (modName: string) => Promise<void>;
  queuedMods: string[]; // Mods actually queued to be applied
  addedMods: string[]; // Mods that have been added to the Mods folder by the user
  onOpenModsDir: () => void;
};

export const ModifyInstallView: FC<Props> = ({
  onBackClicked,
  dirBeingModified,
  onModSelected,
  onQueueMod,
  queuedMods,
  addedMods,
  onDequeueMod,
  onOpenModsDir,
}): React.ReactElement => {
  return (
    <Box padding="2%">
      <Button onClick={() => onBackClicked()}>Back</Button>
      <Typography variant="h4">Modify</Typography>
      <Typography>{`${dirBeingModified}`}</Typography>
      <Grid container>
        <Grid item xs={6}>
          <Grid container>
            <Grid item>
              <Typography variant="h6">Mod List</Typography>
            </Grid>
            <Grid item>
              <Tooltip title="Add a mod to the mod list (this simply adds the mod to your mod storage directory)">
                <div>
                  <input
                    onChange={onModSelected}
                    accept=".zip"
                    id="add-mod-button"
                    type="file"
                    hidden
                  />
                  {addedMods !== undefined &&
                    addedMods.map((modName, index) => (
                      <Button
                        variant="outlined"
                        key={modName}
                        onClick={async () => {
                          onQueueMod(modName);
                        }}
                      >
                        {modName}
                      </Button>
                    ))}
                  <label htmlFor="add-mod-button">
                    <Button component="span">Add a Mod (Zip File)</Button>
                  </label>
                </div>
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={6}>
          <Grid container>
            <Typography variant="h6">Mods To Be Applied</Typography>
            <Grid item>
              {queuedMods.map((modName) => (
                <Button
                  variant="outlined"
                  key={modName}
                  onClick={() => {
                    onDequeueMod(modName);
                  }}
                >
                  {modName}
                </Button>
              ))}
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="outlined"
            onClick={() => {
              console.log('Would apply mods!');
            }}
            disabled={!queuedMods.length}
          >
            Apply Mods
          </Button>
          <Button variant="outlined" onClick={() => onOpenModsDir()}>
            Open Mods Folder
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Grid container>
            <Typography variant="h6">Files Changed by Mods</Typography>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};
