import AdmZip from 'adm-zip';

export const viewFileDirsInZip = (zipFilePath: string): string[] => {
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();

    console.log('entries in zip: ', zipEntries);
    return zipEntries.map((entry) => entry.entryName);
};
