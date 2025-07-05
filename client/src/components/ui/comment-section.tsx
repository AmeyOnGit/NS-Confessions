import { Bot, KeyRound, Sparkles } from "lucide-react";

interface Comment {
  id: number;
  messageId: number;
  content: string;
  createdAt: string;
  isBot: boolean;
  botName?: string;
}

interface CommentSectionProps {
  comments: Comment[];
}

export function CommentSection({ comments }: CommentSectionProps) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id}>
          {comment.isBot ? (
            // AI Bot Comment
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
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
            </div>
          ) : (
            // User Comment
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                <KeyRound className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-slate-800">Anonymous</span>
                  <span className="text-xs text-slate-500">{formatTimeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-slate-700 text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
