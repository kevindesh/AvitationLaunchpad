import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

export interface Reply {
  id: number;
  author: string;
  content: string;
  timestamp: number;
}

export interface Thread {
  id: number;
  title: string;
  author: string;
  category: string;
  likes: number;
  content: string;
  timestamp: number;
  replies: Reply[];
}

interface ForumContextType {
  threads: Thread[];
  addThread: (title: string, content: string, category: string, author: string) => void;
  likeThread: (id: number) => void;
  addReply: (threadId: number, content: string, author: string) => void;
}

const ForumContext = createContext<ForumContextType | undefined>(undefined);

const INITIAL_THREADS: Thread[] = [
  { 
    id: 1, 
    title: "Best tips for your first MRO interview?", 
    author: "Sarah M.", 
    category: "Career Advice", 
    likes: 8, 
    content: "I have my first MRO interview next week with Jazz Aviation. Any tips from people who've been through it?", 
    timestamp: Date.now() - 86400000,
    replies: [
      { id: 101, author: "John D.", content: "Be prepared to talk about Human Factors. They love that.", timestamp: Date.now() - 80000000 },
      { id: 102, author: "Mike T.", content: "Dress sharp and bring your logbook!", timestamp: Date.now() - 75000000 }
    ]
  },
  { 
    id: 2, 
    title: "M2 license study group — who's in?", 
    author: "James R.", 
    category: "Study Groups", 
    likes: 5, 
    content: "Looking for people studying for their M2. I'm in Ontario and would love to set up a virtual study group.", 
    timestamp: Date.now() - 172800000,
    replies: []
  },
  { 
    id: 3, 
    title: "Just landed my first job at Jazz Aviation!", 
    author: "Priya K.", 
    category: "General Discussion", 
    likes: 31, 
    content: "After 3 months of applying, I finally got the call! Thanks to everyone here who helped with my resume and interview prep.", 
    timestamp: Date.now() - 259200000,
    replies: [
      { id: 301, author: "Sarah M.", content: "Congrats!! That's huge.", timestamp: Date.now() - 250000000 }
    ]
  },
  { 
    id: 4, 
    title: "What tools should a new AME carry?", 
    author: "Mike T.", 
    category: "General Discussion", 
    likes: 12, 
    content: "Starting my first job next month. What's the essential toolkit I should bring on day one?", 
    timestamp: Date.now() - 345600000,
    replies: []
  },
  { 
    id: 5, 
    title: "Co-op posting at Bombardier — apply now", 
    author: "Admin", 
    category: "Job Leads", 
    likes: 9, 
    content: "Bombardier has a new co-op posting for avionics technicians in Montreal. Check the Careers section for details!", 
    timestamp: Date.now() - 432000000,
    replies: []
  },
];

export const ForumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [threads, setThreads] = useState<Thread[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("forum_threads");
    if (saved) {
      try {
        const parsed: Thread[] = JSON.parse(saved);
        // Migration: Ensure 'replies' array exists for older data
        const patched = parsed.map(t => ({
          ...t,
          replies: Array.isArray(t.replies) ? t.replies : []
        }));
        setThreads(patched);
      } catch (e) {
        setThreads(INITIAL_THREADS);
      }
    } else {
      setThreads(INITIAL_THREADS);
    }
  }, []);

  // Save to local storage whenever threads change
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem("forum_threads", JSON.stringify(threads));
    }
  }, [threads]);

  const addThread = (title: string, content: string, category: string, author: string) => {
    const newThread: Thread = {
      id: Date.now(),
      title,
      content,
      category,
      author,
      likes: 0,
      timestamp: Date.now(),
      replies: []
    };
    setThreads([newThread, ...threads]);
    toast.success("Post published to the forum!");
  };

  const likeThread = (id: number) => {
    setThreads(threads.map(t => t.id === id ? { ...t, likes: t.likes + 1 } : t));
  };

  const addReply = (threadId: number, content: string, author: string) => {
    setThreads(threads.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          replies: [
            ...(t.replies || []),
            {
              id: Date.now(),
              content,
              author,
              timestamp: Date.now()
            }
          ]
        };
      }
      return t;
    }));
    toast.success("Reply posted!");
  };

  return (
    <ForumContext.Provider value={{ threads, addThread, likeThread, addReply }}>
      {children}
    </ForumContext.Provider>
  );
};

export const useForum = () => {
  const context = useContext(ForumContext);
  if (!context) throw new Error("useForum must be used within ForumProvider");
  return context;
};
