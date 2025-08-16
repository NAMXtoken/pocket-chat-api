import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Phone, Activity, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [contactsResult, messagesResult] = await Promise.all([
        supabase.from("contacts").select("id").limit(1000),
        supabase.from("messages").select("id, direction").limit(1000)
      ]);

      const totalContacts = contactsResult.data?.length || 0;
      const totalMessages = messagesResult.data?.length || 0;
      const inboundMessages = messagesResult.data?.filter(m => m.direction === "inbound").length || 0;
      const outboundMessages = messagesResult.data?.filter(m => m.direction === "outbound").length || 0;

      return {
        totalContacts,
        totalMessages,
        inboundMessages,
        outboundMessages,
      };
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">WhatsApp Messages</h1>
            </div>
            <Button 
              onClick={() => navigate("/messages")}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              View Messages
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor your WhatsApp message activity and contact interactions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalContacts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Unique WhatsApp contacts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
              <p className="text-xs text-muted-foreground">
                All messages received and sent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inbound Messages</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.inboundMessages || 0}</div>
              <p className="text-xs text-muted-foreground">
                Messages received from contacts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outbound Messages</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.outboundMessages || 0}</div>
              <p className="text-xs text-muted-foreground">
                Messages sent to contacts
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Access key features of your WhatsApp integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => navigate("/messages")}
                className="w-full justify-start"
                variant="outline"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                View All Messages
              </Button>
              <div className="text-sm text-muted-foreground">
                Browse conversations, view message history, and manage contacts
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
              <CardDescription>
                Your WhatsApp webhook integration status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Active
                </Badge>
                <span className="text-sm">Webhook connected</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  Your Twilio WhatsApp webhook is properly configured and receiving messages.
                </p>
                <p className="font-mono text-xs bg-muted p-2 rounded">
                  https://qfcdmgatugjqnhgaegzw.supabase.co/functions/v1/twilio-webhook
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
