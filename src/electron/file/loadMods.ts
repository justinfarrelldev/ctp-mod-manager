import fs from 'fs';
import { DEFAULT_MOD_DIR } from '../constants';

export const loadMods = (): string[] => {
  try {
    const filenames = fs.readdirSync(DEFAULT_MOD_DIR);
    return filenames;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`An error occurred while reading the files at ${DEFAULT_MOD_DIR}: ${err}`);
    throw err;
  }
};
