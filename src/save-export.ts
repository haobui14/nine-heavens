import { Capacitor } from '@capacitor/core';

/** Native WebViews cannot download blob links, so hand the save to the OS. */
export async function exportJourney(data: string, filename: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'), import('@capacitor/share'),
    ]);
    const file = await Filesystem.writeFile({ path: filename, data, directory: Directory.Cache, encoding: Encoding.UTF8 });
    try {
      await Share.share({ title: 'Nine Heavens save', files: [file.uri], dialogTitle: 'Export your journey' });
      return true;
    } catch (error) {
      if (/cancel/i.test(error instanceof Error ? error.message : String(error))) return false;
      throw error;
    }
  }
  const link = document.createElement('a');
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
