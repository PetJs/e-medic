import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  MessageSquare,
  Pin,
  PinOff,
  Plus,
  Reply,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/EmptyState";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type {
  DiscussionComment,
  DiscussionPost,
  ListCommentsResponse,
  ListPostsResponse,
  Module,
} from "@/types/api";

const PAGE_SIZE = 20;

function initials(u: { first_name: string; last_name: string }) {
  return `${u.first_name[0] ?? ""}${u.last_name[0] ?? ""}`.toUpperCase();
}

function timeAgo(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function handleError(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
}

type PendingDelete = { kind: "post"; item: DiscussionPost } | { kind: "comment"; item: DiscussionComment };

export default function ModuleDiscussion() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [module, setModule] = useState<Module | null>(null);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [newPostOpen, setNewPostOpen] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);

  const [activePost, setActivePost] = useState<DiscussionPost | null>(null);
  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<DiscussionComment | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [posting, setPosting] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pinningId, setPinningId] = useState<string | null>(null);

  const loadPosts = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api<ListPostsResponse>(`/modules/${id}/posts?page=${page}&limit=${PAGE_SIZE}`)
      .then((res) => {
        setPosts(res.posts ?? []);
        setTotal(res.total_count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, page]);

  useEffect(() => {
    if (!id) return;
    api<Module>(`/modules/${id}`)
      .then(setModule)
      .catch(() => {});
  }, [id]);

  useEffect(loadPosts, [loadPosts]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function loadComments(postId: string) {
    setCommentsLoading(true);
    api<ListCommentsResponse>(`/posts/${postId}/comments`)
      .then((res) => setComments(res.comments ?? []))
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }

  function openPost(post: DiscussionPost) {
    setActivePost(post);
    setReplyTo(null);
    setReplyBody("");
    loadComments(post.id);
  }

  async function createPost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!id) return;
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setCreatingPost(true);
    try {
      await api(`/modules/${id}/posts`, {
        method: "POST",
        body: { title: data.title, body: data.body },
      });
      form.reset();
      setNewPostOpen(false);
      setPage(1);
      loadPosts();
      toast.success("Post created.");
    } catch (err) {
      handleError(err);
    } finally {
      setCreatingPost(false);
    }
  }

  async function submitReply() {
    if (!activePost || !replyBody.trim()) return;
    setPosting(true);
    try {
      await api(`/posts/${activePost.id}/comments`, {
        method: "POST",
        body: { body: replyBody, parent_comment_id: replyTo?.id },
      });
      setReplyBody("");
      setReplyTo(null);
      loadComments(activePost.id);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === activePost.id ? { ...p, comment_count: p.comment_count + 1 } : p
        )
      );
    } catch (err) {
      handleError(err);
    } finally {
      setPosting(false);
    }
  }

  async function togglePin(post: DiscussionPost) {
    setPinningId(post.id);
    try {
      await api(`/admin/posts/${post.id}/pin`, { method: post.is_pinned ? "DELETE" : "POST" });
      loadPosts();
    } catch (err) {
      handleError(err);
    } finally {
      setPinningId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (pendingDelete.kind === "post") {
        await api(`/posts/${pendingDelete.item.id}`, { method: "DELETE" });
        if (activePost?.id === pendingDelete.item.id) setActivePost(null);
        loadPosts();
      } else {
        await api(`/comments/${pendingDelete.item.id}`, { method: "DELETE" });
        if (activePost) {
          loadComments(activePost.id);
          setPosts((prev) =>
            prev.map((p) =>
              p.id === activePost.id ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p
            )
          );
        }
      }
      toast.success("Deleted successfully.");
      setPendingDelete(null);
    } catch (err) {
      handleError(err);
    } finally {
      setDeleting(false);
    }
  }

  function canModerate(authorId: string) {
    return isAdmin || authorId === user?.id;
  }

  const repliesByParent = comments.reduce<Record<string, DiscussionComment[]>>((acc, c) => {
    const key = c.parent_comment_id ?? "root";
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  function renderComment(comment: DiscussionComment, depth: number) {
    const replies = repliesByParent[comment.id] ?? [];
    return (
      <div key={comment.id} style={{ marginLeft: depth > 0 ? 24 : 0 }} className="space-y-2">
        <div className="flex gap-2.5">
          <Avatar size="sm">
            <AvatarFallback>{initials(comment.author)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {comment.author.first_name} {comment.author.last_name}
              </span>
              <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
            </div>
            <p className="font-body text-sm">{comment.body}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setReplyTo(comment)}
              >
                <Reply className="size-3" /> Reply
              </button>
              {canModerate(comment.author.id) && (
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setPendingDelete({ kind: "comment", item: comment })}
                >
                  <Trash2 className="size-3" /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
        {replies.map((r) => renderComment(r, depth + 1))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        to={`/modules/${id}`}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to module
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discussion</h1>
          {module && <p className="text-sm text-muted-foreground">{module.title}</p>}
        </div>
        <Button onClick={() => setNewPostOpen(true)}>
          <Plus className="size-4" /> New Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No discussion yet"
          description="Be the first to start a conversation about this module."
        />
      ) : (
        <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-2">
          {posts.map((post) => (
            <motion.div key={post.id} variants={fadeInUp()}>
              <Card
                className="cursor-pointer transition-colors hover:bg-accent/50"
                onClick={() => openPost(post)}
              >
                <CardContent className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {post.is_pinned && (
                        <Badge variant="secondary" className="gap-1">
                          <Pin className="size-3" /> Pinned
                        </Badge>
                      )}
                      <p className="font-semibold">{post.title}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          title={post.is_pinned ? "Unpin" : "Pin"}
                          disabled={pinningId === post.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(post);
                          }}
                        >
                          {post.is_pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                        </Button>
                      )}
                      {canModerate(post.author.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          title="Delete post"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete({ kind: "post", item: post });
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="line-clamp-2 font-body text-sm text-muted-foreground">{post.body}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Avatar size="sm">
                        <AvatarFallback>{initials(post.author)}</AvatarFallback>
                      </Avatar>
                      {post.author.first_name} {post.author.last_name}
                    </span>
                    <span>{timeAgo(post.created_at)}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3" /> {post.comment_count}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* New post */}
      <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
        <DialogContent>
          <form onSubmit={createPost} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Start a discussion</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input name="title" placeholder="Title" required />
              <Textarea name="body" placeholder="What's on your mind?" required rows={4} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={creatingPost}>
                {creatingPost ? "Posting…" : "Post"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Post detail + comments */}
      <Dialog open={!!activePost} onOpenChange={(open) => !open && setActivePost(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          {activePost && (
            <>
              <DialogHeader>
                <DialogTitle>{activePost.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar size="sm">
                    <AvatarFallback>{initials(activePost.author)}</AvatarFallback>
                  </Avatar>
                  {activePost.author.first_name} {activePost.author.last_name} ·{" "}
                  {timeAgo(activePost.created_at)}
                </div>
                <p className="font-body text-sm whitespace-pre-wrap">{activePost.body}</p>

                <div className="space-y-3 border-t pt-4">
                  {commentsLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet — start the conversation.</p>
                  ) : (
                    (repliesByParent["root"] ?? []).map((c) => renderComment(c, 0))
                  )}
                </div>

                <div className="space-y-2 border-t pt-4">
                  {replyTo && (
                    <div className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                      <span>
                        Replying to {replyTo.author.first_name} {replyTo.author.last_name}
                      </span>
                      <button type="button" onClick={() => setReplyTo(null)} className="hover:text-foreground">
                        Cancel
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Write a comment…"
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      disabled={posting || !replyBody.trim()}
                      onClick={submitReply}
                      title="Send"
                    >
                      <Send className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.kind}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === "post"
                ? "This post and all its comments will be permanently removed."
                : "This comment and any replies to it will be permanently removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
