import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Bubble from "./bubble";
import MainWindow from "./MainWindow";
import { ChatWindow } from "@/views/ChatWindow";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 10_000,
    },
  },
});

export default function App() {
  const path = window.location.pathname;

  if (path === "/main") {
    return (
      <div className="app-main h-screen w-screen overflow-hidden">
        <QueryClientProvider client={queryClient}>
          <MainWindow />
        </QueryClientProvider>
      </div>
    );
  }

  if (path === "/chat") {
    return <ChatWindow />;
  }

  return <Bubble />;
}
