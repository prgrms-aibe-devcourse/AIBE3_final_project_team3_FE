import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/global/backend/client";
import { unwrap } from "@/global/backend/unwrap";

type DeletePostPayload = {
  postId: number;
  reasonCode: number;
};

export function useAdminPostDeleteMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeletePostPayload>({
    mutationFn: async ({ postId, reasonCode }) => {
      const resp = await apiClient.DELETE("/api/v1/admin/posts/{postId}", {
        params: {
          path: {
            postId,
          },
        },
        body: {
          reasonCode,
        },
      });
      await unwrap<void>(resp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
  });
}


