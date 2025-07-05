import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/lib/websocket";
import { MessageCard } from "@/components/ui/message-card";
import { 
  MessageCircle, 
  LogOut, 
  PlusCircle, 
  Send
} from "lucide-react";
import logoImage from "@assets/Screenshot 2025-07-05 at 16.37.55_1751705681308.png";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: number;
  content: string;
  createdAt: string;
  likes: number;
  comments: Comment[];
  commentCount: number;
}

interface Comment {
  id: number;
  messageId: number;
  content: string;
  createdAt: string;
  isBot: boolean;
  botName?: string;
  likes: number;
}

export default function MessageBoard() {
  const [, setLocation] = useLocation();
  const [newMessage, setNewMessage] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'most_liked' | 'most_commented'>('newest');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { connect, disconnect, onMessage, isConnected } = useWebSocket();

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("anonymousboard_auth");
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [setLocation]);

  // Connect to WebSocket
  useEffect(() => {
    connect();
    
    // Handle real-time updates
    onMessage((data) => {
      switch (data.type) {
        case 'new_message':
          queryClient.setQueryData(['/api/messages', sortBy], (old: Message[] | undefined) => {
            return old ? [data.message, ...old] : [data.message];
          });
          toast({
            title: "New Message",
            description: "A new anonymous message was posted",
          });
          break;
        case 'message_liked':
          queryClient.setQueryData(['/api/messages', sortBy], (old: Message[] | undefined) => {
            return old?.map(msg => 
              msg.id === data.messageId 
                ? { ...msg, likes: data.likes }
                : msg
            );
          });
          break;
        case 'new_comment':
          queryClient.setQueryData(['/api/messages', sortBy], (old: Message[] | undefined) => {
            return old?.map(msg => 
              msg.id === data.comment.messageId
                ? { 
                    ...msg, 
                    comments: [...msg.comments, data.comment],
                    commentCount: msg.commentCount + 1
                  }
                : msg
            );
          });
          break;
        case 'comment_liked':
          queryClient.setQueryData(['/api/messages', sortBy], (old: Message[] | undefined) => {
            return old?.map(msg => ({
              ...msg,
              comments: msg.comments.map(comment =>
                comment.id === data.commentId
                  ? { ...comment, likes: data.likes }
                  : comment
              )
            }));
          });
          break;
      }
    });

    return () => {
      disconnect();
    };
  }, [connect, disconnect, onMessage, queryClient, toast, sortBy]);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages', sortBy],
    queryFn: async () => {
      const response = await fetch(`/api/messages?sortBy=${sortBy}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json() as Promise<Message[]>;
    },
    refetchInterval: 30000, // Fallback polling every 30 seconds
  });

  // Submit new message
  const submitMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest('POST', '/api/messages', { content });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post message",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim().length === 0) return;
    
    if (newMessage.length > 500) {
      toast({
        title: "Message too long",
        description: "Messages must be 500 characters or less",
        variant: "destructive",
      });
      return;
    }
    
    submitMessageMutation.mutate(newMessage.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem("anonymousboard_auth");
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="mr-3">
                <img 
                  src={logoImage}
                  alt="NS Flag Logo" 
                  className="h-6 w-auto object-contain"
                />
              </div>
              <h1 className="text-2xl md:text-xl font-bold text-slate-800">NS Confessions</h1>
              <span className="ml-3 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                  {isConnected ? 'Live' : 'Offline'}
                </div>
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-600 hover:text-slate-800"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* New Message Form */}
        <Card className="mb-6 shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="hidden sm:flex w-10 h-10 bg-slate-300 rounded-full items-center justify-center">
                <PlusCircle className="h-5 w-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Forgive me Father for I have sinned..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all duration-200"
                    rows={3}
                    maxLength={500}
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-slate-500">
                        {newMessage.length}/500
                      </span>
                    </div>
                    
                    <Button
                      type="submit"
                      className="text-white font-semibold py-2 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                      style={{ backgroundColor: '#0f162b', borderColor: '#0f162b' }}
                      disabled={submitMessageMutation.isPending || newMessage.trim().length === 0}
                    >
                      {submitMessageMutation.isPending ? (
                        "Posting..."
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Post Anonymously
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sorting Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-lg font-semibold text-slate-800">Messages</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">Sort by:</span>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'newest' | 'most_liked' | 'most_commented')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select sorting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="most_liked">Most Liked</SelectItem>
                <SelectItem value="most_commented">Most Commented</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-slate-600 mt-2">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <MessageCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No messages yet</h3>
                <p className="text-slate-600">Be the first to share your thoughts anonymously!</p>
              </CardContent>
            </Card>
          ) : (
            messages.map((message) => (
              <MessageCard key={message.id} message={message} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
