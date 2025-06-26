'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_DEFAULT_AGENT_ID;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center">
          {children}
        </main>
        <Footer />
      </div>
      
      {/* ElevenLabs ConvAI Widget */}
      {agentId && (
        <div 
          dangerouslySetInnerHTML={{
            __html: `
              <elevenlabs-convai agent-id="${agentId}"></elevenlabs-convai>
              <script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
            `
          }}
        />
      )}
      
      <Toaster />
    </ThemeProvider>
  );
}