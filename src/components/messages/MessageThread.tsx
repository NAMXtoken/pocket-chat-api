import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Send, Phone, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  contact_id: string;
  platform: string;
  direction: string;
  body: string | null;
  media_urls: string[];
  status: string;
  created_at: string;
  provider_message_id: string | null;
  raw_payload: any;
}

interface Contact {
  id: string;
  phone_number: string;
  display_name: string | null;
  platform: string;
  created_at: string;
  updated_at: string;
  metadata: any;
}

interface MessageThreadProps {
  messages: Message[];
  isLoading: boolean;
  selectedContact: Contact | undefined;
}

export const MessageThread = ({ messages, isLoading, selectedContact }: MessageThreadProps) => {
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedContact) return;
    
    // TODO: Implement WhatsApp reply via Twilio
    toast({
      title: "Reply feature coming soon",
      description: "WhatsApp reply integration will be added next",
    });
    setReplyText("");
  };

  const getStatusIcon = (status: string, direction: string) => {
    if (direction === "inbound") return null;
    
    switch (status) {
      case "sent":
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case "delivered":
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case "failed":
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (!selectedContact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Select a contact</h3>
          <p>Choose a conversation from the left to view messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {selectedContact.display_name 
                ? selectedContact.display_name.charAt(0).toUpperCase()
                : selectedContact.phone_number.slice(-2)
              }
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-card-foreground">
                {selectedContact.display_name || "Unknown Contact"}
              </h3>
              <Badge variant="outline">{selectedContact.platform}</Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{selectedContact.phone_number}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start a conversation with this contact</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.direction === "outbound" ? "justify-end" : "justify-start"
                )}
              >
                <Card className={cn(
                  "max-w-[70%] p-3",
                  message.direction === "outbound" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card"
                )}>
                  {message.body && (
                    <p className="text-sm whitespace-pre-wrap mb-2">
                      {message.body}
                    </p>
                  )}
                  
                  {message.media_urls?.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {message.media_urls.map((url, index) => (
                        <div key={index} className="text-sm">
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            Media attachment {index + 1}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className={cn(
                    "flex items-center justify-between text-xs",
                    message.direction === "outbound" 
                      ? "text-primary-foreground/70" 
                      : "text-muted-foreground"
                  )}>
                    <span>
                      {format(new Date(message.created_at), "MMM d, HH:mm")}
                    </span>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {message.status}
                      </Badge>
                      {getStatusIcon(message.status, message.direction)}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Reply Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex space-x-2">
          <Input
            placeholder="Type a message..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendReply()}
            className="flex-1"
          />
          <Button
            onClick={handleSendReply}
            disabled={!replyText.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          WhatsApp reply integration coming soon
        </p>
      </div>
    </div>
  );
};