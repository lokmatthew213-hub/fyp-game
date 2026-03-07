/**
 * Hook for custom student/teacher authentication.
 * Reads from trpc.customAuth.me and exposes login/logout helpers.
 */
import { trpc } from "@/lib/trpc";

export type CustomUser = {
  id: number;
  username: string;
  displayName: string;
  role: "student" | "teacher";
};

export function useCustomAuth() {
  const utils = trpc.useUtils();
  const meQuery = trpc.customAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = trpc.customAuth.login.useMutation({
    onSuccess: () => {
      utils.customAuth.me.invalidate();
    },
  });

  const logoutMutation = trpc.customAuth.logout.useMutation({
    onSuccess: () => {
      utils.customAuth.me.setData(undefined, null);
    },
  });

  return {
    user: (meQuery.data ?? null) as CustomUser | null,
    loading: meQuery.isLoading,
    login: loginMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error?.message ?? null,
    logout: logoutMutation.mutateAsync,
  };
}
