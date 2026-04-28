export interface DesignBrief {
  summary: string;
  appType: string;
  primaryColor: string;
  layout: string;
  components: Array<{ name: string; description: string; details?: string }>;
  copy?: Array<{ where: string; text: string }>;
  interactions?: string[];
}

export interface GeneratedApp {
  name: string;
  description: string;
  files: Record<string, string>;
}

export interface GenerateResponse {
  brief: DesignBrief;
  app: GeneratedApp;
  models: { vision?: string; code: string };
  timing: { visionMs?: number; codeMs: number; totalMs: number };
}

export interface GenerateRequest {
  prompt?: string;
  imageDataUrl?: string;
}
