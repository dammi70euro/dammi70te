import { useCallback, useEffect, useState } from 'react';
import {
  DRIVE_API_KEY,
  DRIVE_VISUAL_FOLDER_ID,
  DRIVE_VISUAL_FOLDER_NAME,
} from '../config/drive';

export type DriveVisualImage = {
  id: string;
  name: string;
};

type DriveListResponse = {
  files?: { id: string; name: string; mimeType: string }[];
};

const IMAGE_MIME_PREFIX = 'image/';

async function resolveVisualFolderId(): Promise<string | null> {
  if (DRIVE_VISUAL_FOLDER_ID) return DRIVE_VISUAL_FOLDER_ID;

  const q = encodeURIComponent(
    `name='${DRIVE_VISUAL_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&key=${DRIVE_API_KEY}&fields=files(id)`,
  );
  const data: DriveListResponse = await response.json();
  return data.files?.[0]?.id ?? null;
}

export function useDriveVisualImages() {
  const [images, setImages] = useState<DriveVisualImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const folderId = await resolveVisualFolderId();
      if (!folderId) {
        throw new Error(`Cartella "${DRIVE_VISUAL_FOLDER_NAME}" non trovata su Drive.`);
      }

      const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&key=${DRIVE_API_KEY}&fields=files(id,name,mimeType)`,
      );
      const data: DriveListResponse = await response.json();

      if (!response.ok) {
        throw new Error('Impossibile caricare le immagini.');
      }

      const imageFiles =
        data.files?.filter((file) => file.mimeType.startsWith(IMAGE_MIME_PREFIX)) ?? [];

      if (!imageFiles.length) {
        throw new Error(`Nessuna immagine in "${DRIVE_VISUAL_FOLDER_NAME}".`);
      }

      setImages(imageFiles.map(({ id, name }) => ({ id, name })));
    } catch (err) {
      setImages([]);
      setError(err instanceof Error ? err.message : 'Errore nel recupero immagini.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchImages();
  }, [fetchImages]);

  return { images, loading, error, refetch: fetchImages };
}
