import React, { FC, useState } from 'react';
import { Typography, Box, Grid, CircularProgress as Loader, Tooltip, Button } from '@mui/material';
import { Folder, BuildCircle, Settings } from '@mui/icons-material';
import { Settings as SettingsMenu } from './components/Settings';
import { Modal } from './components/Modal';
import { AUTO_DETECT_INSTALL_TEXT } from './constants';

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
      copyFileToModDir: (ipcCommand: string, fileDir: string) => void;
      goToRoute: (ipcCommand: string, route: string) => void;
      loadMods: () => Promise<string[]>;
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
  const [settingsOpen, setSettingsOpen] = useState<boolean>();
  const [modNamesAdded, setModNamesAdded] = useState<string[] | undefined>(undefined);
  const [modNamesQueued, setModNamesQueued] = useState<string[]>([]);

  const findInstallDirs = async (): Promise<void> => {
    setLoadingDirs(true);
    const dirs = await (window as ElectronWindow).api.getCtp2InstallDir();
    setInstallDirs(dirs);

    // Should extract this to its own loader eventually
    setModNamesAdded(await (window as ElectronWindow).api.loadMods());

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
    (window as ElectronWindow).api.copyFileToModDir(
      'file:copy',
      (files[0] as File & { path: string }).path
    );
  };

  return (
    <>
      <Grid container>
        <Grid item xs={6}>
          <Box display="flex">
            <Typography variant="h3">Call to Power Mod Manager</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} textAlign="right">
          <Settings onClick={() => setSettingsOpen(true)} />
        </Grid>
      </Grid>
      <Typography variant="h4">Call to Power 2 Installations</Typography>

      {loadingDirs && <Loader />}
      {settingsOpen && (
        <Modal width="50%" open={settingsOpen} onClose={() => setSettingsOpen(false)}>
          <SettingsMenu />
        </Modal>
      )}
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
                        onChange={handleFileSelected}
                        accept=".zip"
                        id="add-mod-button"
                        type="file"
                        hidden
                      />
                      {modNamesAdded !== undefined &&
                        modNamesAdded.map((modName, index) => (
                          <Button
                            variant="outlined"
                            key={modName}
                            onClick={() => {
                              setModNamesQueued([...modNamesQueued, modName]);
                              setModNamesAdded(modNamesAdded.filter((value) => value !== modName));
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
                  {modNamesQueued.map((modName) => (
                    <Button
                      variant="outlined"
                      key={modName}
                      onClick={() => {
                        setModNamesQueued(modNamesQueued.filter((value) => value !== modName));
                        setModNamesAdded([...modNamesAdded, modName]);
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
                onClick={() => alert('would apply mods')}
                disabled={!modNamesQueued.length}
              >
                Apply Mods
              </Button>
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
                {AUTO_DETECT_INSTALL_TEXT}
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
