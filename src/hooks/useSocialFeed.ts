import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
interface Post {
  id: string;
  authorId: string;
  author: any;
  text: string;
  createdAt: string;
  score: number;
  likes: number;
  comments: number;
  reposts: number;
  saves: number;
  liked: boolean;
  saved: boolean;
  reposted: boolean;
  following: boolean;
  media: any[];
  project: any | null;
}

interface FeedResponse {
  data: Post[];
  nextCursor: string | null;
  mode: string;
}

export function useSocialFeed(mode: "for-you" | "network" | "saved" = "for-you") {
  const queryClient = useQueryClient();
  const queryKey = ["social-feed", mode];

  const fetchFeed = async ({ pageParam = null }): Promise<FeedResponse> => {
    let url = `/social/feed?mode=${mode}&limit=20`;
    if (pageParam) {
      url += `&cursor=${pageParam}`;
    }
    const res = await apiFetch<{data: Post[], nextCursor: string | null, mode: string}>(url);
    if (!res || !res.data) {
      throw new Error("Failed to fetch feed");
    }
    return { data: res.data, nextCursor: (res as any).nextCursor || null, mode: (res as any).mode || mode };
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: fetchFeed,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || null,
  });

  const posts = data?.pages.flatMap((page) => page.data) ?? [];

  // Optimistic updates
  const addPost = (newPost: Post) => {
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData;
      const newPages = [...oldData.pages];
      newPages[0] = {
        ...newPages[0],
        data: [newPost, ...newPages[0].data],
      };
      return { ...oldData, pages: newPages };
    });
  };

  const updateInteraction = (postId: string, action: "like" | "unlike" | "save" | "unsave") => {
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          data: page.data.map((post: Post) => {
            if (post.id === postId) {
              if (action === "like") return { ...post, liked: true, likes: post.likes + 1 };
              if (action === "unlike") return { ...post, liked: false, likes: Math.max(0, post.likes - 1) };
              if (action === "save") return { ...post, saved: true, saves: post.saves + 1 };
              if (action === "unsave") return { ...post, saved: false, saves: Math.max(0, post.saves - 1) };
            }
            return post;
          }),
        })),
      };
    });
  };

  return {
    posts,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch,
    addPost,
    updateInteraction,
  };
}
