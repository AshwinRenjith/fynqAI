import { apiFetch } from "@/lib/apiClient";
import type { AnswerGenerationResponse } from "@/types/api";

export interface GenerateAnswerParams {
  doubtId: string;
  forceRefresh?: boolean;
}

export async function generateAnswer({ doubtId, forceRefresh = false }: GenerateAnswerParams): Promise<AnswerGenerationResponse> {
  const query = forceRefresh ? "?force_refresh=true" : "";
  return apiFetch<AnswerGenerationResponse>(`/doubts/${encodeURIComponent(doubtId)}/answer${query}`, {
    method: "POST",
  });
}
