import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormattedTextarea } from "@/components/ui/formatted-textarea";
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
  demoted?: boolean;
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
  const [sortBy, setSortBy] = useState<'newest' | 'most_liked' | 'most_commented' | 'hottest'>('hottest');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = localStorage.getItem("anonymousboard_admin") === "true";
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
          queryClient.invalidateQueries({ queryKey: ['/api/messages', sortBy] });
          queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
          toast({
            title: "New Message",
            description: "A new anonymous message was posted",
          });
          break;
        case 'message_liked':
          queryClient.invalidateQueries({ queryKey: ['/api/messages', sortBy] });
          queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
          break;
        case 'new_comment':
        case 'comment_liked':
        case 'message_deleted':
        case 'comment_deleted':
        case 'message_demoted':
          queryClient.invalidateQueries({ queryKey: ['/api/messages', sortBy] });
          queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
          break;
      }
    });

    return () => {
      disconnect();
    };
  }, [connect, disconnect, onMessage, queryClient, toast, sortBy]);

  // Fetch messages with infinite scroll
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['/api/messages', sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/messages?sortBy=${sortBy}&limit=20&offset=${pageParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json() as Promise<Message[]>;
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer than 20 messages, we've reached the end
      if (lastPage.length < 20) {
        return undefined;
      }
      // Return the next offset
      return allPages.length * 20;
    },
    initialPageParam: 0,
    refetchInterval: 30000, // Fallback polling every 30 seconds
  });

  // Flatten all pages into a single array of messages
  const messages = data?.pages.flat() || [];
  
  // Get overall statistics from server
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Infinite scroll with intersection observer
  const [loadMoreElement, setLoadMoreElement] = useState<HTMLDivElement | null>(null);
  
  useEffect(() => {
    if (!loadMoreElement || isLoading || isFetchingNextPage || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreElement);
    return () => observer.disconnect();
  }, [loadMoreElement, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Submit new message
  const submitMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest('POST', '/api/messages', { content });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
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
    localStorage.removeItem("anonymousboard_admin");
    localStorage.removeItem("anonymousboard_session");
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
              {isAdmin && (
                <span className="ml-3 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  Admin
                </span>
              )}
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
        {/* Message from the void */}
        <Card className="mb-6 shadow-sm border border-slate-200">
          <CardContent className="p-4">
            <p className="text-sm text-slate-700">
              <span className="font-bold">A message from the void:</span> This space thrives on curiosity, honesty, and weirdness. Not harm. Don't post anything that could get someone hurt, harassed, or hauled into a meeting. Let's not ruin a good thing. ✨
            </p>
          </CardContent>
        </Card>

        {/* New Message Form */}
        <Card className="mb-6 shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="hidden sm:flex w-10 h-10 bg-slate-300 rounded-full items-center justify-center">
                <PlusCircle className="h-5 w-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormattedTextarea
                    value={newMessage}
                    onChange={setNewMessage}
                    placeholder="Forgive me Father for I have sinned..."
                    className="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all duration-200"
                    rows={3}
                    maxLength={500}
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1"></div>
                    
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

        {/* Total Count Display */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center space-x-6 text-center">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-slate-800">{stats?.totalPosts || 0}</span>
              <span className="text-sm text-slate-600">Total Posts</span>
            </div>
            <div className="h-8 w-px bg-slate-300"></div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-slate-700">{stats?.totalMessages || 0}</span>
              <span className="text-xs text-slate-500">Messages</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-slate-700">{stats?.totalComments || 0}</span>
              <span className="text-xs text-slate-500">Comments</span>
            </div>
          </div>
        </div>

        {/* Sorting Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-lg font-semibold text-slate-800">Messages</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">Sort by:</span>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'newest' | 'most_liked' | 'most_commented' | 'hottest')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select sorting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hottest">Hottest</SelectItem>
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
            <>
              {messages.map((message) => (
                <MessageCard key={message.id} message={message} isAdmin={isAdmin} />
              ))}
              
              {/* Infinite scroll trigger */}
              {hasNextPage && (
                <div 
                  ref={setLoadMoreElement}
                  className="flex justify-center py-8"
                >
                  {isFetchingNextPage ? (
                    <div className="flex items-center space-x-2 text-slate-600">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span>Loading more messages...</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => fetchNextPage()}
                      variant="outline"
                      className="text-slate-600 hover:text-slate-800"
                    >
                      Load more messages
                    </Button>
                  )}
                </div>
              )}
              
              {!hasNextPage && messages.length > 0 && (
                <div className="text-center py-8 text-slate-500">
                  <p>You've reached the very beginning! 🎉</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
