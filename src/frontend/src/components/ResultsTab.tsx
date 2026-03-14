import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Printer, RotateCcw, Trophy, UserRound } from "lucide-react";
import { useState } from "react";
import { useApp } from "../store/AppContext";
import { formatCurrency, getRemainingBudget, getTierClasses } from "../types";
import type { Tier } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getTierClasses(tier)}`}
    >
      {tier}
    </span>
  );
}

export function ResultsTab() {
  const { state, dispatch } = useApp();
  const { teams, players, tournament } = state;
  const [resetOpen, setResetOpen] = useState(false);
  const [newTournamentOpen, setNewTournamentOpen] = useState(false);

  const soldPlayers = players.filter((p) => p.status === "sold");
  const unsoldPlayers = players.filter((p) => p.status === "unsold");
  const totalSold = soldPlayers.reduce((s, p) => s + (p.soldPrice ?? 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 print-area">
      {/* Controls */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-bold">Auction Results</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-ocid="results.print_button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <Printer className="h-4 w-4 mr-1.5" /> Print
          </Button>
          <Button
            data-ocid="results.reset_auction_button"
            variant="outline"
            size="sm"
            onClick={() => setResetOpen(true)}
            className="border-red-800 text-red-400 hover:bg-red-950"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" /> Reset Auction
          </Button>
          <Button
            data-ocid="results.new_tournament_button"
            variant="outline"
            size="sm"
            onClick={() => setNewTournamentOpen(true)}
            className="border-red-800 text-red-400 hover:bg-red-950"
          >
            <Plus className="h-4 w-4 mr-1.5" /> New Tournament
          </Button>
        </div>
      </div>

      {/* Tournament header */}
      {tournament.name && (
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          {tournament.logoUrl && (
            <Avatar className="h-16 w-16 rounded-xl border border-border">
              <AvatarImage src={tournament.logoUrl} />
              <AvatarFallback className="bg-secondary rounded-xl">
                T
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <h1 className="text-2xl font-bold">{tournament.name}</h1>
            <p className="text-muted-foreground text-sm">
              {soldPlayers.length} players sold · {formatCurrency(totalSold)}{" "}
              total spent
            </p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Teams", value: teams.length },
          { label: "Players Sold", value: soldPlayers.length },
          { label: "Unsold", value: unsoldPlayers.length },
          { label: "Total Spent", value: formatCurrency(totalSold) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-lg p-4 text-center"
          >
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Teams results */}
      {teams.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Team Rosters</h3>
          <ScrollArea className="h-[400px] no-print">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2">
              {teams.map((team, idx) => {
                const teamPlayers = soldPlayers.filter(
                  (p) => p.soldToTeamId === team.id,
                );
                const remaining = getRemainingBudget(team);
                const pct = Math.round((remaining / team.budget) * 100);
                return (
                  <div
                    key={team.id}
                    data-ocid={`results.item.${idx + 1}`}
                    className="bg-card border border-border rounded-xl p-4 space-y-3 relative overflow-hidden"
                  >
                    {/* Team logo as faded background */}
                    {team.logoUrl && (
                      <img
                        src={team.logoUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none select-none"
                      />
                    )}
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-md border border-border">
                          <AvatarImage src={team.logoUrl} />
                          <AvatarFallback className="bg-secondary text-sm rounded-md">
                            {team.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate">
                            {team.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Progress value={pct} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatCurrency(remaining)}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-muted-foreground border-border text-xs whitespace-nowrap"
                        >
                          {teamPlayers.length} players
                        </Badge>
                      </div>
                      {teamPlayers.length > 0 ? (
                        <div className="space-y-1">
                          {teamPlayers.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-2 bg-secondary/60 rounded-md px-2 py-1.5"
                            >
                              <Avatar className="h-6 w-6 rounded-md">
                                <AvatarImage src={p.photoUrl} />
                                <AvatarFallback className="text-[9px] bg-muted rounded-md">
                                  {p.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium flex-1 truncate">
                                {p.name}
                              </span>
                              <TierBadge tier={p.tier} />
                              <span className="text-xs text-accent font-bold">
                                {formatCurrency(p.soldPrice ?? 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          No players bought
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          {/* Print version (not scrolled) */}
          <div className="hidden print:block grid grid-cols-2 gap-4">
            {teams.map((team) => {
              const teamPlayers = soldPlayers.filter(
                (p) => p.soldToTeamId === team.id,
              );
              const remaining = getRemainingBudget(team);
              return (
                <div
                  key={team.id}
                  className="border border-gray-300 rounded p-3 space-y-2"
                >
                  <p className="font-bold">
                    {team.name} — {formatCurrency(remaining)} remaining
                  </p>
                  {teamPlayers.map((p) => (
                    <p key={p.id} className="text-sm">
                      {p.name} ({p.tier}, {p.specialty}) —{" "}
                      {formatCurrency(p.soldPrice ?? 0)}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          data-ocid="results.empty_state"
          className="bg-card border border-dashed border-border rounded-xl p-10 text-center"
        >
          <UserRound className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            No results yet. Complete the auction to see results.
          </p>
        </div>
      )}

      {/* Unsold players */}
      {unsoldPlayers.length > 0 && (
        <div className="space-y-3">
          <Separator className="bg-border" />
          <h3 className="text-lg font-semibold">Unsold Players</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {unsoldPlayers.map((p, idx) => (
              <div
                key={p.id}
                data-ocid={`results.unsold.item.${idx + 1}`}
                className="flex items-center gap-2 bg-red-950/30 border border-red-900 rounded-lg p-2.5"
              >
                <Avatar className="h-8 w-8 rounded-md">
                  <AvatarImage src={p.photoUrl} />
                  <AvatarFallback className="text-xs bg-secondary rounded-md">
                    {p.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.specialty}</p>
                </div>
                <TierBadge tier={p.tier} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground py-4 no-print">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset Auction"
        description="This will clear all sold/unsold results and restore all team budgets. Players remain in the system. Continue?"
        confirmLabel="Reset Auction"
        onConfirm={() => {
          dispatch({ type: "RESET_AUCTION" });
          setResetOpen(false);
        }}
        destructive
      />
      <ConfirmDialog
        open={newTournamentOpen}
        onOpenChange={setNewTournamentOpen}
        title="New Tournament"
        description="This will permanently delete all tournament data, teams, players, and auction history. This cannot be undone."
        confirmLabel="Start New Tournament"
        onConfirm={() => {
          dispatch({ type: "NEW_TOURNAMENT" });
          setNewTournamentOpen(false);
        }}
        destructive
      />
    </div>
  );
}
