import { useEffect, useRef, useState } from 'react';
import { getAccessToken } from '../../api/axios';
import { progressApi } from '../../api/progress.api';
import { Spinner } from '../ui/Spinner';

interface VideoPlayerProps {
  lessonId: string;
  onTimeUpdate?: (seconds: number) => void;
  onEnded?: () => void;
  onCompleted?: () => void;
  startAt?: number;
}

export default function VideoPlayer({
  lessonId,
  onTimeUpdate,
  onEnded,
  onCompleted,
  startAt = 0,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [token, setToken] = useState<string | null>(getAccessToken());
  const lastSavedRef = useRef(0);
  const lastSentSecondRef = useRef(0);

  useEffect(() => {
    if (token) return;
    const id = setInterval(() => {
      const t = getAccessToken();
      if (t) {
        setToken(t);
        clearInterval(id);
      }
    }, 100);
    return () => clearInterval(id);
  }, [token]);

  useEffect(() => {
    lastSavedRef.current = 0;
    lastSentSecondRef.current = 0;
    if (videoRef.current && startAt > 0) {
      videoRef.current.currentTime = startAt;
    }
  }, [lessonId, startAt, token]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const seconds = Math.floor((e.target as HTMLVideoElement).currentTime);
    if (seconds === lastSentSecondRef.current) return;
    lastSentSecondRef.current = seconds;
    onTimeUpdate?.(seconds);

    // Guarda cada 10s para no saturar
    if (seconds - lastSavedRef.current >= 10) {
      lastSavedRef.current = seconds;
      progressApi.update(lessonId, seconds).catch(() => null);
    }
  };

  const handleEnded = async () => {
    try {
      await progressApi.complete(lessonId);
      onCompleted?.();
    } catch {
      // silent
    }
    onEnded?.();
  };

  if (!token) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-black">
        <Spinner size="lg" />
      </div>
    );
  }

  const src = `/api/video/${lessonId}/stream?t=${encodeURIComponent(token)}`;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video
        ref={videoRef}
        key={`${lessonId}-${token.slice(-8)}`}
        src={src}
        controls
        className="h-full w-full"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
    </div>
  );
}
