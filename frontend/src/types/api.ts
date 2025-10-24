export type InputType = "text" | "image" | "multimodal";

export interface DoubtUploadResponse {
  doubt_id: string;
  extracted_text: string;
  subject: string;
  topic: string | null;
  confidence: number;
  input_type: InputType;
  entities?: Record<string, string> | null;
}

export interface ReinforcementMCQ {
  question: string;
  options: string[];
  correct_option: number;
  explanation?: string | null;
}

export interface FollowUpQuizItem {
  question: string;
  options: string[];
  correct_option: number;
  explanation?: string | null;
  difficulty?: string | null;
}

export interface FollowUpPlan {
  hints: string[];
  quiz: FollowUpQuizItem[];
  revision_plan: string[];
  recommended_topics?: string[];
  encouragement?: string | null;
}

export interface AnswerGenerationResponse {
  response_id: string;
  doubt_id: string;
  response_text: string;
  explanation?: string | null;
  reinforcement_mcq?: ReinforcementMCQ | null;
  confidence_score?: number | null;
  estimated_time?: string | null;
  metadata?: {
    context_ids?: string[];
    context_count?: number;
    subject?: string | null;
    follow_up_plan?: FollowUpPlan;
    [key: string]: unknown;
  } | null;
}

export interface StudentDashboardView {
  user_id: string;
  strengths: string[];
  weaknesses: string[];
  preferred_styles: Record<string, number>;
  dominant_style: string | null;
  subject_focus: Array<{ subject: string; proficiency: number }>;
  recent_topics: string[];
  active_streak_days: number;
  last_interaction_at: string | null;
  alerts: string[];
}
