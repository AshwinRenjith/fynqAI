import { apiFetch } from "@/lib/apiClient";
import type { StudentDashboardView } from "@/types/api";

export async function fetchStudentDashboard(userId: string): Promise<StudentDashboardView> {
  return apiFetch<StudentDashboardView>(`/students/${encodeURIComponent(userId)}/dashboard`);
}
