import React, { FC, useEffect, useState } from 'react';
import { Typography, Box, Grid, CircularProgress as Loader, Tooltip, Button } from '@mui/material';
import { Settings } from '@mui/icons-material';
import { Settings as SettingsMenu } from './components/Settings';
import { Modal } from './components/Modal';
import { AUTO_DETECT_INSTALL_TEXT } from './constants';
import { InstallDirTable } from './components/InstallDirTable';
import { IZipEntry } from 'adm-zip';
import { ErrorModal } from './components/ErrorModal';

export type ElectronWindow = Window &
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
      openModsDir: (ipcCommand: string) => void;
      copyFileToModDir: (ipcCommand: string, fileDir: string) => Promise<void>;
      viewFileDirsInZip: (ipcCommand: string, zipFilePath: string) => Promise<string[]>;
      goToRoute: (ipcCommand: string, route: string) => void;
      loadMods: () => Promise<string[]>;
      getModsDir: (ipcCommand: string) => Promise<string>;
      selectFolder: (ipcCommand: string) => Promise<string>;
      isValidInstall: (ipcCommand: string, dir: string) => Promise<boolean>;
      addToInstallDirs: (ipcCommand: string, dir: string) => Promise<void>;
      getInstallDirs: (ipcCommand: 'file:getInstallDirs') => Promise<string[]>;
      runGame: (ipcCommand: 'file:runGame', exeDir: string) => void;
      removeFromInstallDirs: (
        ipcCommand: 'file:removeFromInstallDirs',
        dir: string
      ) => Promise<void>;
    };
  };

export type InstallDirectory = {
  os: string;
  directory: string;
  installationType: 'steam' | 'gog';
};

export const App: FC = (): React.ReactElement => {
  const [loadingDirs, setLoadingDirs] = useState<boolean>();
  const [installDirModalOpen, setInstallDirModalOpen] = useState<boolean>(false);
  const [installDirs, setInstallDirs] = useState<InstallDirectory[]>([]);
  const [dirBeingModified, setDirBeingModified] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState<boolean>();
  const [modNamesAdded, setModNamesAdded] = useState<string[] | undefined>(undefined);
  const [modNamesQueued, setModNamesQueued] = useState<string[]>([]);
  const [error, setError] = useState<string>();

  const loadMods = async (): Promise<void> => {
    try {
      setModNamesAdded(await (window as ElectronWindow).api.loadMods());
    } catch (err) {
      console.error(`An error occurred within App while setting mod names: ${err}`);
      setError(`An error occurred while attempting to load mods: ${err}.`);
    }
  };

  const loadInstallDirs = async (): Promise<void> => {
    setLoadingDirs(true);
    const dirsFromFile = await (window as ElectronWindow).api.getInstallDirs('file:getInstallDirs');

    setInstallDirs(
      dirsFromFile.map((dir) => ({ directory: dir, installationType: 'steam', os: 'win32' }))
    );
    setLoadingDirs(false);
    if (dirsFromFile.length === 0) {
      setInstallDirModalOpen(true);
    }
  };

  const findInstallDirs = async (): Promise<void> => {
    setLoadingDirs(true);
    const dirs: InstallDirectory[] = await (window as ElectronWindow).api.getCtp2InstallDir();

    for (const dir of dirs) {
      // For the sake of speed, I am disabling this
      // eslint-disable-next-line no-await-in-loop
      await (window as ElectronWindow).api.addToInstallDirs('file:addToInstallDirs', dir.directory);
    }

    setInstallDirs([...installDirs, ...dirs]);

    await loadMods();

    setLoadingDirs(false);
  };

  const handleInstallDirModalClose = (): void => {
    setInstallDirModalOpen(false);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = Array.from(e.target.files);
    await (window as ElectronWindow).api.copyFileToModDir(
      'file:copy',
      (files[0] as File & { path: string }).path
    );

    await loadMods();
  };

  const openModsDir = (): void => {
    console.log('opening mods dir');
    (window as ElectronWindow).api.openModsDir('file:openModsDir');
  };

  const viewFileDirsInZip = async (zipFilePath: string): Promise<string[]> => {
    const contents = await (window as ElectronWindow).api.viewFileDirsInZip(
      'file:viewFileDirsInZip',
      zipFilePath
    );

    console.log('contents: ', contents);
    return contents;
  };

  const getModsDir = async (): Promise<string> => {
    return await (window as ElectronWindow).api.getModsDir('file:getModsDir');
  };

  useEffect(() => {
    loadInstallDirs();
  }, []);

  return (
    <>
      <Grid container>
        <Grid item xs={6}>
          <Box display="flex">
            <Typography variant="h4">Call to Power 2 Installations</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} textAlign="right">
          <Settings onClick={() => setSettingsOpen(true)} />
        </Grid>
      </Grid>

      {error && (
        <ErrorModal
          open={error.length > 0}
          errorMessage={error}
          onClose={() => {
            setError('');
          }}
        />
      )}
      {loadingDirs && <Loader />}
      {settingsOpen && (
        <Modal width="50%" open={settingsOpen} onClose={() => setSettingsOpen(false)}>
          <SettingsMenu />
        </Modal>
      )}

      <InstallDirTable
        installDirs={installDirs}
        onClickModify={(dir) => setDirBeingModified(dir)}
        onAddedInstallDirectory={() => loadInstallDirs()}
      />
      <Modal
        open={dirBeingModified !== ''}
        onClose={() => {
          setDirBeingModified('');
        }}
        width="100%"
        height="100%"
      >
        <Box padding="2%">
          <Button onClick={() => setDirBeingModified('')}>Back</Button>
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
                            onClick={async () => {
                              setModNamesQueued([...modNamesQueued, modName]);
                              setModNamesAdded(modNamesAdded.filter((value) => value !== modName));
                              viewFileDirsInZip(`${await getModsDir()}\\${modName}`); // FIXME 100% temporary
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
              <Button variant="outlined" onClick={() => openModsDir()}>
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
      </Modal>
      <Modal width="50%" open={installDirModalOpen} onClose={handleInstallDirModalClose}>
        <Box>
          <Grid container rowSpacing="1rem">
            <Grid item xs={12}>
              <Typography textAlign="center">{AUTO_DETECT_INSTALL_TEXT}</Typography>
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
