import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/sonner";
import { Gavel, Settings, Trophy } from "lucide-react";
import { useState } from "react";
import { AuctionTab } from "./components/AuctionTab";
import { ResultsTab } from "./components/ResultsTab";
import { SetupTab } from "./components/SetupTab";
import { AppProvider } from "./store/AppContext";
import { useApp } from "./store/AppContext";

type Tab = "setup" | "auction" | "results";

function AppInner() {
  const [activeTab, setActiveTab] = useState<Tab>("setup");
  const { state } = useApp();
  const { tournament } = state;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tournament.logoUrl ? (
              <Avatar className="h-8 w-8 rounded-md">
                <AvatarImage src={tournament.logoUrl} />
                <AvatarFallback className="text-xs bg-secondary rounded-md">
                  T
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center">
                <Gavel className="h-4 w-4 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold leading-none">
                {tournament.name || "Cricket Auction Manager"}
              </h1>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                Offline Auction Tool
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {(
              [
                {
                  id: "setup",
                  label: "Setup",
                  icon: Settings,
                  ocid: "nav.setup_tab",
                },
                {
                  id: "auction",
                  label: "Auction",
                  icon: Gavel,
                  ocid: "nav.auction_tab",
                },
                {
                  id: "results",
                  label: "Results",
                  icon: Trophy,
                  ocid: "nav.results_tab",
                },
              ] as const
            ).map(({ id, label, icon: Icon, ocid }) => (
              <button
                type="button"
                key={id}
                data-ocid={ocid}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {activeTab === "setup" && <SetupTab />}
        {activeTab === "auction" && (
          <AuctionTab onGoToResults={() => setActiveTab("results")} />
        )}
        {activeTab === "results" && <ResultsTab />}
      </main>

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
