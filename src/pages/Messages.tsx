import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContactsList } from "@/components/messages/ContactsList";
import { MessageThread } from "@/components/messages/MessageThread";
import { MessagesLayout } from "@/components/messages/MessagesLayout";
import { useToast } from "@/hooks/use-toast";

const Messages = () => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("updated_at", { ascending: false });
      
      if (error) {
        toast({
          title: "Error loading contacts",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      return data;
    },
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", selectedContactId],
    queryFn: async () => {
      if (!selectedContactId) return [];
      
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("contact_id", selectedContactId)
        .order("created_at", { ascending: true });
      
      if (error) {
        toast({
          title: "Error loading messages",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      return data;
    },
    enabled: !!selectedContactId,
  });

  return (
    <MessagesLayout>
      <div className="flex h-screen bg-background">
        <ContactsList
          contacts={contacts || []}
          isLoading={contactsLoading}
          selectedContactId={selectedContactId}
          onContactSelect={setSelectedContactId}
        />
        
        <MessageThread
          messages={messages || []}
          isLoading={messagesLoading}
          selectedContact={contacts?.find(c => c.id === selectedContactId)}
        />
      </div>
    </MessagesLayout>
  );
};

export default Messages;