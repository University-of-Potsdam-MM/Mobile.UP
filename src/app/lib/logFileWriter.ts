import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { WriteFileOptions } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const saveFileAndShare = async (
  fileNameWithExtension: string,
  logString: string
): Promise<boolean> => {
  // Native
  try {
    const fileConfig: WriteFileOptions = {
      path: `Exports/${fileNameWithExtension}`,
      data: logString,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    };
    const writeFileResult = await Filesystem.writeFile(fileConfig);
    await Share.share({ url: writeFileResult.uri });

    return true;
  } catch (error) {
    console.error('Error creating file: ', JSON.stringify(error));
    return false;
  }
};
