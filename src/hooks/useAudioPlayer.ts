import { useCallback, useEffect, useRef, useState } from 'react';
import { bindPlaybackAnalyser, clearPlaybackAnalyser } from '../audio/graph';
import { driveMediaUrl } from '../config/drive';
import type { DriveTrack } from './useDriveTracks';

export function useAudioPlayer(tracks: DriveTrack[]) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsClickId, setNeedsClickId] = useState<string | null>(null);

  const attachAnalyser = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    const analyser = await bindPlaybackAnalyser(audio);
    if (analyser) analyserRef.current = analyser;
  }, []);

  const playTrack = useCallback(async (track: DriveTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    setNeedsClickId(null);
    audio.src = driveMediaUrl(track.id);

    try {
      await audio.play();
      setPlayingId(track.id);
    } catch {
      setNeedsClickId(track.id);
      setPlayingId(null);
    }
  }, []);

  const shareTrack = useCallback((track: DriveTrack) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?play=${track.id}`;

    if (navigator.share) {
      navigator
        .share({
          title: track.name,
          text: `Ascolta questa canzone: ${track.name}`,
          url: shareUrl,
        })
        .catch(() => undefined);
      return;
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      `Ascolta questa canzone: ${track.name} ${shareUrl}`,
    )}`;
    window.open(whatsappUrl, '_blank');
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPlaying = () => {
      void attachAnalyser();
    };
    const onPause = () => {
      setIsPlaying(false);
      clearPlaybackAnalyser(audio);
      analyserRef.current = null;
    };
    const onEnded = () => {
      setIsPlaying(false);
      setPlayingId(null);
      clearPlaybackAnalyser(audio);
      analyserRef.current = null;
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      clearPlaybackAnalyser(audio);
    };
  }, [attachAnalyser]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.keyCode !== 32) return;
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      event.preventDefault();
      const audio = audioRef.current;
      if (!audio) return;

      if (audio.paused) {
        void audio.play();
      } else {
        audio.pause();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!tracks.length) return;

    const params = new URLSearchParams(window.location.search);
    const playId = params.get('play');
    if (!playId) return;

    const track = tracks.find((t) => t.id === playId);
    if (track) {
      void playTrack(track);
    }
  }, [tracks, playTrack]);

  return {
    audioRef,
    analyserRef,
    playingId,
    isPlaying,
    needsClickId,
    playTrack,
    shareTrack,
  };
}
