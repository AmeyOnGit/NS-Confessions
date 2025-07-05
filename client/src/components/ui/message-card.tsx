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
}

interface MessageCardProps {
  message: Message;
}

export function MessageCard({ message }: MessageCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
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
      return await apiRequest('POST', `/api/messages/${message.id}/like`);
    },
    onSuccess: () => {
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
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`w-10 h-10 ${getBgColor()} rounded-full flex items-center justify-center`}>
            {getIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-sm font-medium text-slate-800">{getAnonymousName()}</span>
              <span className="text-xs text-slate-500">{formatTimeAgo(message.createdAt)}</span>
              {Date.now() - new Date(message.createdAt).getTime() < 300000 && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1 animate-pulse"></div>
                    New
                  </div>
                </span>
              )}
            </div>
            
            <p className="text-slate-700 mb-2 leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
            
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className="flex items-center space-x-2 text-slate-500 hover:text-red-500 transition-colors p-0"
                disabled={likeMutation.isPending}
              >
                <Heart className="h-4 w-4" />
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
              

            </div>
            
            {/* Comments Section */}
            {showComments && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <CommentSection comments={message.comments} />
                
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
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                      rows={2}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500">{newComment.length}/500</span>
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-1 px-3 rounded-lg text-sm transition-colors"
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
