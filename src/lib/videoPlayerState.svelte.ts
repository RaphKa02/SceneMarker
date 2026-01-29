import type { VideoState } from '$lib/types';
import { emitTo } from '@tauri-apps/api/event';

class VideoPlayerState {
  videoElement = $state<HTMLVideoElement | null>(null);
  videoPath = $state<string>();
  playing = $state(false);
  currentTime = $state(0);
  duration = $state(0);
  isMuted = $state(false);
  volume = $state(1);
  videoSpeed = $state(1);
  isFullscreen = $state(false);
  showControlls = $state(false);

  getStatePayload = (): VideoState => ({
    videoPath: this.videoPath,
    playing: this.playing,
    currentTime: this.currentTime,
  });

  togglePlay = () => {
    if (this.playing) {
      this.videoElement?.pause();
    } else {
      this.videoElement?.play();
    }
    this.playing = !this.playing;
  };

  handleLoadedMetadata = async () => {
    this.duration = this.videoElement?.duration ?? 0;
  };

  handlePlay = () => {
    this.playing = true;
    this.syncState();
  };

  handlePause = () => {
    this.playing = false;
    this.syncState();
  };

  seekTo = (time: number) => {
    if (this.videoElement) {
      this.videoElement.currentTime = time;
      this.currentTime = time;
      this.syncState();
    }
  };

  skip = async (seconds: number) => {
    if (this.videoElement) {
      this.currentTime = Math.max(0, Math.min(this.duration, this.currentTime + seconds));
      this.videoElement.currentTime = this.currentTime;
      this.syncState();
    }
  };

  toggleMute = () => {
    this.isMuted = !this.isMuted;
    if (this.videoElement) {
      this.videoElement.muted = this.isMuted;
    }
  };

  toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      this.videoElement?.requestFullscreen();
      this.isFullscreen = true;
    } else {
      document.exitFullscreen();
      this.isFullscreen = false;
    }
  };

  syncState = () => {
    emitTo<VideoState>('presentation', 'video-state-update', this.getStatePayload());
  };
}

export const videoPlayerState = new VideoPlayerState();
