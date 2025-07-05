import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CommentSection } from "./comment-section";
import { 
  Heart, 
  MessageCircle, 
  KeyRound,
  ChevronDown,
  ChevronUp,
  Trash2,
  TrendingDown,
  User,
  UserX,
  Ghost,
  Eye,
  Zap,
  Star,
  Crown,
  Feather,
  Sparkles,
  Moon,
  Sun,
  Coffee,
  Lightbulb,
  Music,
  Camera,
  Heart as HeartIcon,
  Flame,
  Snowflake,
  Leaf,
  Waves
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Comment {
  id: number;
  messageId: number;
  content: string;
  createdAt: string;
  isBot: boolean;
  botName?: string;
  likes: number;
}

interface Message {
  id: number;
  content: string;
  createdAt: string;
  likes: number;
  comments: Comment[];
  commentCount: number;
  demoted?: boolean;
}

interface MessageCardProps {
  message: Message;
  isAdmin?: boolean;
}

export function MessageCard({ message, isAdmin = false }: MessageCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const likeMutation = useMutation({
    mutationFn: async () => {
      const sessionId = localStorage.getItem("anonymousboard_session");
      return await apiRequest('POST', `/api/messages/${message.id}/like`, { sessionId });
    },
    onSuccess: () => {
      setIsLiked(true);
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like message",
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest('POST', `/api/messages/${message.id}/comments`, { content });
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/messages/${message.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: "Message deleted",
        description: "The message has been removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete message",
        variant: "destructive",
      });
    },
  });

  const demoteMessageMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/messages/${message.id}/demote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: "Message demoted",
        description: "This message will no longer rise with new comments",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to demote message",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim().length === 0) return;
    
    if (newComment.length > 500) {
      toast({
        title: "Comment too long",
        description: "Comments must be 500 characters or less",
        variant: "destructive",
      });
      return;
    }
    
    commentMutation.mutate(newComment.trim());
  };

  const getBgColor = () => {
    const colors = ['bg-indigo-100', 'bg-purple-100', 'bg-green-100', 'bg-blue-100', 'bg-pink-100'];
    return colors[message.id % colors.length];
  };

  const getIconColor = () => {
    const colors = ['text-indigo-600', 'text-purple-600', 'text-green-600', 'text-blue-600', 'text-pink-600'];
    return colors[message.id % colors.length];
  };

  const getAnonymousName = () => {
    const names = [
      'Midnight Wanderer',
      'Neon Dreamer',
      'Silent Observer',
      'Cosmic Thinker',
      'Urban Ghost',
      'Digital Nomad',
      'Velvet Voice',
      'Shadow Dancer',
      'Electric Soul',
      'Moonlight Scribe',
      'Starlight Poet',
      'Thunder Whisperer',
      'Ocean Mystic',
      'Forest Sage',
      'Crystal Gazer',
      'Night Owl',
      'Dawn Chaser',
      'Storm Rider',
      'Fire Walker',
      'Ice Breaker',
      'Cloud Surfer',
      'Wind Runner',
      'Light Bender',
      'Time Keeper',
      'Dream Weaver'
    ];
    return names[message.id % names.length];
  };

  const getIcon = () => {
    const icons = [
      Ghost, Star, Moon, Sun, Zap, Crown, Feather, Sparkles, 
      Eye, Coffee, Lightbulb, Music, Camera, HeartIcon, Flame, 
      Snowflake, Leaf, Waves, User, UserX
    ];
    const IconComponent = icons[message.id % icons.length];
    return <IconComponent className={`h-5 w-5 ${getIconColor()}`} />;
  };

  return (
    <Card className="shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className={`w-10 h-10 ${getBgColor()} rounded-full flex items-center justify-center`}>
            {getIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-base md:text-sm font-medium text-slate-800">{getAnonymousName()}</span>
              <span className="text-sm md:text-xs text-slate-500">{formatTimeAgo(message.createdAt)}</span>
              {Date.now() - new Date(message.createdAt).getTime() < 300000 && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1 animate-pulse"></div>
                    New
                  </div>
                </span>
              )}
            </div>
            
            <p className="text-slate-700 mb-2 leading-relaxed whitespace-pre-wrap text-base md:text-sm">
              {message.content}
            </p>
            
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center space-x-2 transition-colors p-0 ${
                  isLiked ? 'text-pink-500' : 'text-slate-500 hover:text-red-500'
                }`}
                disabled={likeMutation.isPending}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-pink-500' : ''}`} />
                <span>{message.likes}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-2 text-slate-500 hover:text-[#0f162b] transition-colors p-0"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{message.commentCount}</span>
                {showComments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              {isAdmin && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => demoteMessageMutation.mutate()}
                    className="flex items-center space-x-2 text-slate-500 hover:text-orange-500 transition-colors p-0"
                    disabled={demoteMessageMutation.isPending || message.demoted}
                  >
                    <TrendingDown className="h-4 w-4" />
                    <span>{message.demoted ? "Demoted" : "Demote"}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMessageMutation.mutate()}
                    className="flex items-center space-x-2 text-slate-500 hover:text-red-500 transition-colors p-0"
                    disabled={deleteMessageMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </Button>
                </>
              )}

            </div>
            
            {/* Comments Section */}
            {showComments && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <CommentSection comments={message.comments} isAdmin={isAdmin} />
                
                {/* Add Comment Form */}
                <form onSubmit={handleComment} className="flex items-start space-x-3 mt-4">
                  <div className={`w-8 h-8 ${getBgColor()} rounded-full flex items-center justify-center`}>
                    {getIcon()}
                  </div>
                  <div className="flex-1">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add an anonymous comment..."
                      className="w-full px-3 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                      rows={1}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500">{newComment.length}/500</span>
                      <Button
                        type="submit"
                        size="sm"
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 hover:bg-primary/90 text-primary-foreground font-medium py-1 px-3 rounded-lg text-sm transition-colors bg-[#0f162b]"
                        disabled={commentMutation.isPending || newComment.trim().length === 0}
                      >
                        {commentMutation.isPending ? "Posting..." : "Comment"}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
