const DEFAULT_DRIVE_API_KEY = 'AIzaSyCsKsvTqnlnDD94CYef0diL_M0jZ4HqjTk';
const DEFAULT_DRIVE_FOLDER_ID = '1JdLjxDa8xNTDYJgUCGLurORSbW0pXUAn';

function envOrDefault(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export const DRIVE_API_KEY = envOrDefault(
  import.meta.env.VITE_DRIVE_API_KEY,
  DEFAULT_DRIVE_API_KEY,
);
export const DRIVE_FOLDER_ID = envOrDefault(
  import.meta.env.VITE_DRIVE_FOLDER_ID,
  DEFAULT_DRIVE_FOLDER_ID,
);

export function driveMediaUrl(fileId: string): string {
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${DRIVE_API_KEY}`;
}
