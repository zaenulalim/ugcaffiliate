export type AspectRatio = '9:16' | '1:1' | '16:9';

export type CameraAngle =
  | 'Eye Level'
  | 'Close Up'
  | 'Extreme Close Up'
  | 'Medium Shot'
  | 'Full Body'
  | 'Over Shoulder'
  | 'POV'
  | 'Selfie Camera'
  | 'Mirror Shot'
  | 'Low Angle'
  | 'High Angle'
  | 'Product Focus';

export type VisualStyle =
  | 'UGC Natural'
  | 'Mirror Check'
  | 'POV Hand Review'
  | 'Beauty Influencer'
  | 'Lifestyle Content'
  | 'Product Showcase'
  | 'Cinematic UGC'
  | 'Luxury Branding'
  | 'Testimonial Style'
  | 'Before & After Review';

export type VoiceOverStyle =
  | 'Soft Selling'
  | 'Hard Selling'
  | 'Testimonial'
  | 'Educational'
  | 'Storytelling'
  | 'Problem-Solution'
  | 'Beauty Influencer'
  | 'Lifestyle Influencer'
  | 'Professional Review'
  | 'Emotional Marketing';

export interface ProductSpec {
  name: string;
  function: string;
  benefits: string;
  targetAudience: string;
  category: string;
  marketingAngle: string;
  rawImage?: string; // base64
}

export interface CharacterConfig {
  mode: 'reference' | 'generator';
  gender: 'Male' | 'Female';
  ageRange: '18–25' | '26–35' | '36–45' | '46+';
  hijab: 'Yes' | 'No';
  referenceImage?: string; // base64 or webcam stream
  croppedImage?: string;
  cropSettings?: { zoom: number; rotate: number; rotateAngle: number };
}

export interface StoryboardScene {
  sceneNum: number;
  description: string;
  cameraAngle: string;
  characterExpression: string;
  characterActivity: string;
  visualPrompt: string;
  suggestedVoiceover: string;
}

export interface VoiceOverOutput {
  style: string;
  duration: number;
  hook: string;
  script: string;
  cta: string;
}

export interface UGCContentMarketing {
  hooks: string[];
  captions: string[];
  hashtags: string[];
}

export interface UGCImageOutput {
  id: string;
  imageUrl: string;
  title: string;
  poseVariationIndex: number;
  isCustomGenerated: boolean;
  prompt: string;
  videoPrompt: string;
  voiceoverScript: string;
  lipSyncInstructions: string;
  aspectRatio: AspectRatio;
  cameraAngle: CameraAngle;
  visualStyle: VisualStyle;
}

export interface CampaignState {
  product: ProductSpec;
  character: CharacterConfig;
  background: {
    selected: string; // Background type e.g. 'Aesthetic Bedroom' or 'Custom'
    customPrompt: string;
  };
  aspectRatio: AspectRatio;
  cameraAngle: CameraAngle;
  visualStyle: VisualStyle;
  storyboardScenesCount: 3 | 5 | 8 | 10;
  voiceOverStyle: VoiceOverStyle;
  voiceOverDuration: 15 | 30 | 45 | 60;
  outputCount: 2 | 4 | 8 | 16;
}
