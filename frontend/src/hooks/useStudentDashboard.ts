import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchStudentDashboard } from "@/api/studentProfile";
import type { StudentDashboardView } from "@/types/api";

const studentDashboardKey = (userId: string | undefined) => ["student-dashboard", userId];

export function useStudentDashboard(userId: string | undefined): UseQueryResult<StudentDashboardView> {
  return useQuery({
    queryKey: studentDashboardKey(userId),
    queryFn: () => fetchStudentDashboard(userId as string),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}
