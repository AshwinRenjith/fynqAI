import { useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatHeader from "@/components/ChatHeader";
import ChatArea from "@/components/ChatArea";
import ChatInput from "@/components/ChatInput";

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <ChatSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        
        <div className="flex-1 flex flex-col min-h-0">
          <ChatArea />
          <ChatInput />
        </div>
      </div>
    </div>
  );
};

export default Index;
