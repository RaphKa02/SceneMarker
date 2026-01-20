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
    emitTo('presentation', 'video-state-update', this);
  };

  handlePause = () => {
    this.playing = false;
    emitTo('presentation', 'video-state-update', this);
  };

  seekTo = (time: number) => {
    if (this.videoElement) {
      this.videoElement.currentTime = time;
      this.currentTime = time;
      emitTo('presentation', 'video-state-update', this);
    }
  };

  skip = async (seconds: number) => {
    if (this.videoElement) {
      this.currentTime = Math.max(0, Math.min(this.duration, this.currentTime + seconds));
      this.videoElement.currentTime = this.currentTime;
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
}

export const videoPlayerState = new VideoPlayerState();
