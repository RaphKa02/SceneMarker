export interface Scene {
  id: string;
  title: string;
  time: number;
  category?: string;
}

export interface Project {
  filePath?: string;
  videoPath: string;
  scenes: Scene[];
  currentTime: number;
}
