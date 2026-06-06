import { useCallback, useEffect, useState } from 'react';
import { DRIVE_API_KEY, DRIVE_FOLDER_ID } from '../config/drive';

export type DriveTrack = {
  id: string;
  name: string;
};

type DriveListResponse = {
  files?: Array<{ id: string; name: string; mimeType: string }>;
};

export function useDriveTracks() {
  const [tracks, setTracks] = useState<DriveTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = encodeURIComponent(`'${DRIVE_FOLDER_ID}' in parents`);
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&key=${DRIVE_API_KEY}`,
      );
      const data: DriveListResponse = await response.json();

      if (!response.ok) {
        throw new Error('Impossibile caricare le tracce');
      }

      const audioFiles =
        data.files?.filter(
          (file) => file.mimeType === 'audio/mpeg' || file.mimeType === 'audio/wav',
        ) ?? [];

      setTracks(audioFiles.map(({ id, name }) => ({ id, name })));
    } catch {
      setError('Errore nel recupero delle canzoni da Drive.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  return { tracks, loading, error, refetch: fetchTracks };
}
