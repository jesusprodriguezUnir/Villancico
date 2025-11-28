export interface LyricLine {
  section: string;
  text: string;
  time: number;
  imageKey: string;
  visualDescription: string; // Used to fetch specific images
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasEnded: boolean;
}