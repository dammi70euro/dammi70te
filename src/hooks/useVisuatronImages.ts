import { useCallback, useEffect, useRef, useState } from 'react';
import { useDriveVisualImages } from './useDriveVisualImages';

export type VisuatronImage = {
  id: string;
  name: string;
  source: 'drive' | 'local';
  url?: string;
};

export function useVisuatronImages() {
  const { images: driveImages, loading, error, refetch } = useDriveVisualImages();
  const [localImages, setLocalImages] = useState<VisuatronImage[]>([]);
  const blobUrlsRef = useRef<string[]>([]);

  const images: VisuatronImage[] = [
    ...driveImages.map((img) => ({
      id: img.id,
      name: img.name,
      source: 'drive' as const,
    })),
    ...localImages,
  ];

  const addLocalFiles = useCallback((files: FileList | File[]): VisuatronImage[] => {
    const list = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (!list.length) return [];

    const added: VisuatronImage[] = list.map((file) => {
      const url = URL.createObjectURL(file);
      blobUrlsRef.current.push(url);
      return {
        id: `local-${url}`,
        name: file.name,
        source: 'local',
        url,
      };
    });

    setLocalImages((prev) => [...prev, ...added]);
    return added;
  }, []);

  const removeLocal = useCallback((id: string) => {
    setLocalImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.url) {
        URL.revokeObjectURL(target.url);
        blobUrlsRef.current = blobUrlsRef.current.filter((url) => url !== target.url);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  useEffect(() => {
    const urls = blobUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return {
    images,
    driveLoading: loading,
    driveError: error,
    refetchDrive: refetch,
    addLocalFiles,
    removeLocal,
  };
}
