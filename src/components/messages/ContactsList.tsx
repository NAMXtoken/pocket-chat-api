import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Phone, MessageCircle } from "lucide-react";
import { format } from "date-fns";

interface Contact {
  id: string;
  phone_number: string;
  display_name: string | null;
  platform: string;
  created_at: string;
  updated_at: string;
  metadata: any;
}

interface ContactsListProps {
  contacts: Contact[];
  isLoading: boolean;
  selectedContactId: string | null;
  onContactSelect: (contactId: string) => void;
}

export const ContactsList = ({
  contacts,
  isLoading,
  selectedContactId,
  onContactSelect,
}: ContactsListProps) => {
  if (isLoading) {
    return (
      <div className="w-80 border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-card-foreground">Contacts</h2>
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-border bg-card">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-card-foreground">
          Contacts ({contacts.length})
        </h2>
      </div>
      
      <ScrollArea className="h-[calc(100vh-160px)]">
        <div className="p-2">
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No contacts yet</p>
              <p className="text-sm">Messages will appear here when received</p>
            </div>
          ) : (
            contacts.map((contact) => (
              <Card
                key={contact.id}
                className={cn(
                  "p-3 mb-2 cursor-pointer transition-colors hover:bg-accent",
                  selectedContactId === contact.id && "bg-accent border-primary"
                )}
                onClick={() => onContactSelect(contact.id)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {contact.display_name 
                        ? contact.display_name.charAt(0).toUpperCase()
                        : contact.phone_number.slice(-2)
                      }
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-card-foreground truncate">
                        {contact.display_name || "Unknown"}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {contact.platform}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span className="truncate">{contact.phone_number}</span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Updated {format(new Date(contact.updated_at), "MMM d, HH:mm")}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};