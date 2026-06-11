import { useEffect, useState } from "react";
import { TopNav } from "../sections/TopNav";
import { Footer } from "../sections/Footer";

export function LegalLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="mx-auto max-w-[860px] px-6 pt-16 pb-24 sm:pt-24">
        {mounted ? children : <div className="min-h-[40vh]" />}
      </main>
      <Footer />
    </div>
  );
}
