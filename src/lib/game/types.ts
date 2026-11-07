export type Speaker = "male" | "female";
export type SceneId = "cafe" | "bar";

export interface DialogueLine {
  id: string;
  speaker: Speaker;
  en: string;
  es: string;
}

export interface Conversation {
  id: string;
  title: string;
  topic: string;
  scene: SceneId;
  starter: Speaker;
  lines: DialogueLine[];
  updatedAt: number;
}

export const CHARACTERS: Record<Speaker, { name: string; role: string }> = {
  male: { name: "Daniel", role: "Barista" },
  female: { name: "Sofía", role: "Barista" },
};

export const SCENES: Record<SceneId, { name: string; subtitle: string }> = {
  cafe: { name: "Cafetería Arte y Pasión", subtitle: "Scene 1 · Dining room" },
  bar: { name: "Barra de café", subtitle: "Scene 2 · Coffee bar" },
};

export const SCENE_ORDER: SceneId[] = ["cafe", "bar"];
