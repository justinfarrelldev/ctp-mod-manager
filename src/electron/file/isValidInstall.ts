import fs from 'fs';

export const isValidInstall = async (dir: string): Promise<boolean> => {
  // If there is a ctp2_data dir on the top level, it is a valid install
  return fs.readdirSync(dir).filter((file) => file.endsWith('ctp2_data')).length > 0;
};
