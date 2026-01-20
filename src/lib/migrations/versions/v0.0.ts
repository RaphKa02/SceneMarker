export namespace V0_0 {
  export interface Project {
    filePath?: string;
    videoPath: string;
    scenes: Scene[];
    currentTime: number;
  }

  interface Scene {
    id: string;
    title: string;
    time: number;
    category?: string;
  }
}
