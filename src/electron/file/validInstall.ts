import fs from 'fs';

export const validInstall = async (dir: string): Promise<string> => {
  // If there is a ctp2_data dir on the top level, it is a valid install
  return String(fs.readdirSync(dir).filter((file) => file.endsWith('ctp2_data')).length > 0);
};
