import { TopNav } from "./sections/TopNav";
import { Hero } from "./sections/Hero";
import { Capabilities } from "./sections/Capabilities";
import { Privacy } from "./sections/Privacy";
import { Direction } from "./sections/Direction";
import { Footer } from "./sections/Footer";

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main>
        <Hero />
        <Capabilities />
        <Privacy />
        <Direction />
      </main>
      <Footer />
    </div>
  );
}
