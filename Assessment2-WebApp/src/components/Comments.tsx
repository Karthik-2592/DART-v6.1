import React, { useState, useEffect, useCallback } from 'react';
import { getMediaUrl } from '../utils/mediaUtils';
import { API_URL } from '../constants/api';

export interface CommentType {
  id: number;
  text: string;
  like_count: number;
  created_at: string;
  username: string;
  display_name: string;
  profile_picture: string | null;
}

interface CommentsProps {
  songId: number;
}

export default function Comments({ songId }: CommentsProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(8);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id?: number; username: string; display_name: string; profile_picture?: string } | null>(null);

  // Load current user from session storage
  useEffect(() => {
    const saved = sessionStorage.getItem("dart_v6_1_user");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse user from sessionStorage", e);
      }
    }
  }, []);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/comments/song/${songId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch comments", error);
    }
  }, [songId]);

  // Initial fetch
  useEffect(() => {
    fetchComments();
    // Reset visible count when song changes
    setVisibleCount(8);
  }, [fetchComments]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser || !currentUser.id) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          song_id: songId,
          user_id: currentUser.id,
          text: newCommentText.trim().substring(0, 400)
        })
      });

      if (response.ok) {
        setNewCommentText("");
        // Reload comments to show the newly posted one
        await fetchComments();
        // Since it's sorted by DESC, the new comment will be at the top, visible within the first 8.
      } else {
        console.error("Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: number) => {
    try {
      const response = await fetch(`${API_URL}/comments/${commentId}/like`, {
        method: "POST"
      });
      if (response.ok) {
        // Optimistically update the single comment like_count in state
        setComments((prev) => 
          prev.map((c) => c.id === commentId ? { ...c, like_count: c.like_count + 1 } : c)
        );
      }
    } catch (error) {
      console.error("Error liking comment", error);
    }
  };

  const visibleComments = comments.slice(0, visibleCount);
  const hasMore = visibleCount < comments.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 8);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <section className="w-full flex flex-col gap-6 mt-10">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="text-xl font-bold text-fg-primary font-[var(--font-family-heading)]">
          Comments <span className="text-fg-muted font-normal text-sm ml-2">({comments.length})</span>
        </h3>
      </div>

      {/* Comment Input */}
      {currentUser ? (
        <form onSubmit={handlePostComment} className="flex gap-4 items-start">
          <div className="w-10 h-10 shrink-0 rounded-full bg-bg-card-hover overflow-hidden mt-1 border border-border">
            {currentUser.profile_picture ? (
              <img
                src={getMediaUrl(currentUser.profile_picture, 'profilePic')}
                alt={currentUser.display_name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
                <svg className="w-full h-full text-fg-muted p-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2 relative">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-bg-card border border-border rounded-xl p-3 text-sm text-fg-primary placeholder:text-fg-muted focus:outline-none focus:border-accent resize-none transition-colors"
               maxLength={400}
               rows={2}
               disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-1">
                <span className={`text-xs ${newCommentText.length >= 400 ? 'text-red-500' : 'text-fg-muted'}`}>
                    {newCommentText.length}/400
                </span>
                <button
                type="submit"
                disabled={!newCommentText.trim() || isSubmitting}
                className="px-4 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {isSubmitting ? "Posting..." : "Post"}
                </button>
            </div>
          </div>
        </form>
      ) : (
          <div className="p-4 bg-bg-card border border-border rounded-xl text-center text-sm text-fg-muted">
              Log in to join the conversation.
          </div>
      )}

      {/* Comments List */}
      <div className="flex flex-col gap-5 mt-4">
        {comments.length === 0 ? (
          <div className="py-10 text-center text-fg-muted italic">
            Be the first to comment!
          </div>
        ) : (
            <>
                {visibleComments.map((comment) => (
                <div key={comment.id} className="flex gap-4 group">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-bg-card overflow-hidden border border-border">
                        {comment.profile_picture ? (
                            <img
                            src={getMediaUrl(comment.profile_picture, 'profilePic')}
                            alt={comment.display_name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            <svg className="w-full h-full text-fg-muted p-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-fg-primary">{comment.display_name}</span>
                            <span className="text-xs text-fg-muted">@{comment.username}</span>
                            <span className="text-xs text-fg-muted/60 ml-auto">{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="text-sm text-fg-secondary whitespace-pre-wrap break-words border border-border/40 p-3 rounded-lg bg-bg-card/50">
                            {comment.text}
                        </p>
                        <div className="flex items-center mt-2 gap-4">
                            <button 
                                onClick={() => handleLike(comment.id)}
                                className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-accent transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                                <span>{comment.like_count > 0 ? comment.like_count : 'Like'}</span>
                            </button>
                        </div>
                    </div>
                </div>
                ))}

                {hasMore && (
                <div className="flex justify-center mt-4">
                    <button
                        onClick={handleLoadMore}
                        className="px-6 py-2 text-sm text-accent border border-accent/30 rounded-full hover:bg-accent hover:text-white transition-all duration-300 shadow-sm"
                    >
                        Load More Comments
                    </button>
                </div>
                )}
            </>
        )}
      </div>
    </section>
  );
}
