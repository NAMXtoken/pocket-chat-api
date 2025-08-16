import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MessagesLayoutProps {
  children: ReactNode;
}

export const MessagesLayout = ({ children }: MessagesLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Messages</h1>
            </div>
          </div>
        </div>
      </header>
      
      <main className="h-[calc(100vh-80px)]">
        {children}
      </main>
    </div>
  );
};