export interface Frame {
  id: string;
  pixels: string[]; // User drawing
  basePixels?: string[]; // Template/Base layer (read-only)
  duration?: number; // Frame duration multiplier (default 1)
}

export interface ProjectData {
  gridSize: number;
  frames: Frame[];
  palette: string[];
  layers?: Layer[];
}

export interface Layer {
  id: string;
  name: string;
  pixels: string[];
  visible: boolean;
  locked: boolean;
}

export interface Project extends ProjectData {
  id: number;
  name: string;
  data: string; // JSON string of ProjectData
  thumbnail: string;
  type: 'avatar' | 'item' | 'scene';
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  xp: number;
  level: number;
  creations_count: number;
  challenges_entered: number;
  badges_count: number;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  reward_type: string;
  reward_value: string;
  end_date: string;
}

export interface Submission {
  id: number;
  challenge_id: number;
  project_id: number;
  user_id: number;
  reactions: {
    fire: number;
    sparkle: number;
    diamond: number;
    crown: number;
  };
}
