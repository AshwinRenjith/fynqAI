import { apiFetch } from "@/lib/apiClient";
import type { DoubtUploadResponse, InputType } from "@/types/api";

export interface UploadDoubtParams {
  userId: string;
  text: string;
  inputType?: InputType;
  examType?: string;
  additionalText?: string | null;
}

export async function uploadDoubt({
  userId,
  text,
  inputType = "text",
  examType = "JEE",
  additionalText = null,
}: UploadDoubtParams): Promise<DoubtUploadResponse> {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("input_type", inputType);
  formData.append("text", text);
  formData.append("exam_type", examType);
  if (additionalText) {
    formData.append("user_additional_text", additionalText);
  }

  return apiFetch<DoubtUploadResponse>("/doubts/upload_doubt", {
    method: "POST",
    body: formData,
  });
}
