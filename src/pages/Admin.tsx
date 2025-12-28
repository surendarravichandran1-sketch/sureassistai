import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ArrowLeft, Users, MessageSquare, Calendar } from "lucide-react";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      if (!isAdmin) {
        navigate("/");
        return;
      }
      fetchUsers();
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      setUsers(data);
    }
    setIsLoading(false);
  };

  const fetchSessions = async (userId: string) => {
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    
    if (data) {
      setSessions(data);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    
    if (data) {
      setMessages(data);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setSelectedSession(null);
    setMessages([]);
    fetchSessions(userId);
  };

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSession(sessionId);
    fetchMessages(sessionId);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedUserProfile = users.find(u => u.user_id === selectedUser);

  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">View all users and their chat history</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users ({users.length})
              </CardTitle>
              <CardDescription>Select a user to view their chats</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {users.map((userProfile) => (
                    <button
                      key={userProfile.id}
                      onClick={() => handleUserSelect(userProfile.user_id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedUser === userProfile.user_id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="font-medium">{userProfile.display_name}</div>
                      <div className="text-sm opacity-70">
                        Joined {format(new Date(userProfile.created_at), "MMM d, yyyy")}
                      </div>
                    </button>
                  ))}
                  {users.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No users yet</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Sessions List */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Chat Sessions
              </CardTitle>
              <CardDescription>
                {selectedUserProfile ? `${selectedUserProfile.display_name}'s chats` : "Select a user first"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleSessionSelect(session.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedSession === session.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="font-medium truncate">{session.title || "New Chat"}</div>
                      <div className="text-sm opacity-70">
                        {format(new Date(session.updated_at), "MMM d, yyyy HH:mm")}
                      </div>
                    </button>
                  ))}
                  {selectedUser && sessions.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No chat sessions</p>
                  )}
                  {!selectedUser && (
                    <p className="text-muted-foreground text-center py-4">Select a user to see their sessions</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages View */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chat Messages
              </CardTitle>
              <CardDescription>
                {selectedSession ? `${messages.length} messages` : "Select a session to view messages"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-primary/10 ml-4"
                          : "bg-muted mr-4"
                      }`}
                    >
                      <div className="text-xs font-medium mb-1 opacity-70">
                        {message.role === "user" ? "User" : "Assistant"}
                      </div>
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {message.content.length > 500 
                          ? message.content.substring(0, 500) + "..." 
                          : message.content}
                      </div>
                      <div className="text-xs opacity-50 mt-1">
                        {format(new Date(message.created_at), "HH:mm")}
                      </div>
                    </div>
                  ))}
                  {selectedSession && messages.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No messages in this session</p>
                  )}
                  {!selectedSession && (
                    <p className="text-muted-foreground text-center py-4">Select a session to view messages</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
