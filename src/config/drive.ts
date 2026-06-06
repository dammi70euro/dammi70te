export const DRIVE_API_KEY = 'AIzaSyCsKsvTqnlnDD94CYef0diL_M0jZ4HqjTk';
export const DRIVE_FOLDER_ID = '1JdLjxDa8xNTDYJgUCGLurORSbW0pXUAn';

export function driveMediaUrl(fileId: string): string {
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${DRIVE_API_KEY}`;
}
