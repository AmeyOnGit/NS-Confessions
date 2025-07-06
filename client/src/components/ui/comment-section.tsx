import { 
  Bot, 
  KeyRound, 
  Sparkles, 
  Ghost,
  Star,
  Moon,
  Sun,
  Zap,
  Crown,
  Feather,
  Eye,
  Coffee,
  Lightbulb,
  Music,
  Camera,
  Heart,
  Flame,
  Snowflake,
  Leaf,
  Waves,
  User,
  UserX,
  Trash2
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { parseTextContent } from "@/lib/text-parser";

interface Comment {
  id: number;
  messageId: number;
  content: string;
  createdAt: string;
  isBot: boolean;
  botName?: string;
  likes: number;
}

interface CommentSectionProps {
  comments: Comment[];
  isAdmin?: boolean;
}

export function CommentSection({ comments, isAdmin = false }: CommentSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const sessionId = localStorage.getItem("anonymousboard_session");
      return await apiRequest('POST', `/api/comments/${commentId}/like`, { sessionId });
    },
    onSuccess: (data, commentId) => {
      setLikedComments(prev => new Set(prev).add(commentId));
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like comment",
        variant: "destructive",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return await apiRequest('DELETE', `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: "Comment deleted",
        description: "The comment has been removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  const getAnonymousName = (commentId: number) => {
    const names = [
      'Whisper Walker',
      'Night Watcher',
      'Secret Keeper',
      'Phantom Writer',
      'Shadow Sage',
      'Mystic Voice',
      'Anonymous Angel',
      'Hidden Truth',
      'Quiet Storm',
      'Invisible Ink',
      'Echo Chamber',
      'Masked Marvel',
      'Silent Speaker',
      'Cryptic Curator',
      'Faceless Friend',
      'Unnamed Hero',
      'Blank Canvas',
      'Hollow Heart',
      'Empty Echo',
      'Void Voice',
      'Nameless Knight',
      'Ghostly Guide',
      'Spectral Scribe',
      'Phantom Philosopher',
      'Shadow Storyteller'
    ];
    return names[commentId % names.length];
  };

  const getCommentIcon = (commentId: number) => {
    const icons = [
      Ghost, Star, Moon, Sun, Zap, Crown, Feather, 
      Eye, Coffee, Lightbulb, Music, Camera, Heart, 
      Flame, Snowflake, Leaf, Waves, User, UserX
    ];
    return icons[commentId % icons.length];
  };

  const getBgColor = (commentId: number) => {
    const colors = ['bg-indigo-100', 'bg-purple-100', 'bg-green-100', 'bg-blue-100', 'bg-pink-100', 'bg-yellow-100', 'bg-red-100'];
    return colors[commentId % colors.length];
  };

  const getIconColor = (commentId: number) => {
    const colors = ['text-indigo-600', 'text-purple-600', 'text-green-600', 'text-blue-600', 'text-pink-600', 'text-yellow-600', 'text-red-600'];
    return colors[commentId % colors.length];
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id}>
          {comment.isBot ? (
            // AI Bot Comment
            (<div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-semibold text-amber-800">
                      {comment.botName || 'RoastBot'}
                    </span>
                    <span className="px-2 py-1 bg-amber-200 text-amber-800 text-xs font-medium rounded-full flex items-center">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI
                    </span>
                    <span className="text-xs text-amber-600">{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-amber-800 text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            </div>)
          ) : (
            // User Comment
            (<div className="flex items-start space-x-3">
              <div className={`w-8 h-8 ${getBgColor(comment.id)} rounded-full flex items-center justify-center`}>
                {(() => {
                  const IconComponent = getCommentIcon(comment.id);
                  return <IconComponent className={`h-4 w-4 ${getIconColor(comment.id)}`} />;
                })()}
              </div>
              <div className="flex-1 flex items-start justify-between">
                <div className="flex-1 pr-3">
                  <div className="mb-2">
                    <span className="text-xs font-medium text-slate-800">{getAnonymousName(comment.id)}</span>
                    {!comment.isBot && (
                      <div className="block md:inline md:ml-2">
                        <span className="text-sm md:text-xs text-slate-500">{formatTimeAgo(comment.createdAt)}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-slate-700 text-xs whitespace-pre-wrap">{parseTextContent(comment.content)}</div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => likeCommentMutation.mutate(comment.id)}
                    className="justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent rounded-md flex items-center space-x-1 transition-colors p-0 h-auto text-slate-500 hover:text-red-500 mt-[26px] mb-[26px] ml-[6px] mr-[6px] pt-[0px] pb-[0px]"
                    disabled={likeCommentMutation.isPending}
                  >
                    <Heart className={`h-3 w-3 ${likedComments.has(comment.id) ? 'fill-pink-500' : ''}`} />
                    <span className="text-xs">{comment.likes}</span>
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      className="flex items-center space-x-1 text-slate-500 hover:text-red-500 transition-colors p-0 h-auto"
                      disabled={deleteCommentMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="text-xs">Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>)
          )}
        </div>
      ))}
    </div>
  );
}
