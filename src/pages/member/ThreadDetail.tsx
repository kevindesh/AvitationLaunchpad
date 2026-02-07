import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useForum } from "@/contexts/ForumContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, ThumbsUp, Send, User } from "lucide-react";
import { toast } from "sonner";

// Simple time formatter instead of date-fns to avoid dependency issues
const formatTimeAgo = (timestamp: number) => {
  if (!timestamp) return "";
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function ThreadDetail() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { threads, likeThread, addReply } = useForum();
  const [replyContent, setReplyContent] = useState("");

  const thread = threads.find(t => t.id === Number(threadId));

  if (!thread) {
    return (
      <div className="section-padding container mx-auto text-center pt-20">
        <h2 className="text-2xl font-bold mb-4">Thread not found</h2>
        <Button onClick={() => navigate("/member/forum")}>Back to Forum</Button>
      </div>
    );
  }

  const handleReply = () => {
    if (!replyContent.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    
    addReply(thread.id, replyContent, user?.name || "Anonymous");
    setReplyContent("");
  };

  return (
    <section className="section-padding bg-background min-h-screen">
      <div className="container max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/member/forum")} className="mb-6 pl-0 hover:pl-2 transition-all">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Forum
        </Button>
        
        {/* Main Post */}
        <Card className="border-0 shadow-md bg-card mb-8">
          <CardContent className="p-8">
            <div className="flex gap-4">
              <div className="hidden sm:flex w-12 h-12 bg-primary/10 rounded-full items-center justify-center shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{thread.category}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Posted {formatTimeAgo(thread.timestamp)}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{thread.title}</h1>
                <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed mb-6">{thread.content}</p>
                
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-2">
                     <span className="text-sm font-medium text-primary">{thread.author}</span>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => likeThread(thread.id)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors">
                        <ThumbsUp className="h-4 w-4" /> {thread.likes} Likes
                     </button>
                     <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4" /> {(thread.replies || []).length} Replies
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies List */}
        <div className="space-y-6 mb-10">
          <h3 className="text-xl font-semibold mb-4">Replies ({(thread.replies || []).length})</h3>
          
          {(thread.replies || []).length === 0 ? (
            <p className="text-muted-foreground italic">No replies yet. Be the first to start the conversation!</p>
          ) : (
            (thread.replies || []).map((reply) => (
              <Card key={reply.id} className="border bg-card/50">
                <CardContent className="p-6">
                   <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm">{reply.author}</span>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(reply.timestamp)}</span>
                   </div>
                   <p className="text-sm text-foreground/80">{reply.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Reply Form */}
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Leave a Reply</h3>
            <Textarea 
              placeholder="Share your thoughts..." 
              value={replyContent} 
              onChange={(e) => setReplyContent(e.target.value)} 
              className="min-h-[120px] mb-4"
            />
            <div className="flex justify-end">
              <Button variant="gold" onClick={handleReply} disabled={!replyContent.trim()}>
                <Send className="h-4 w-4 mr-2" /> Post Reply
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
