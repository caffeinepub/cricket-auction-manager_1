import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Gavel,
  RotateCcw,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useApp } from "../store/AppContext";
import {
  TIER_RULES,
  type Tier,
  formatCurrency,
  getNextBid,
  getRemainingBudget,
  getTierClasses,
  getTierGlow,
} from "../types";

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getTierClasses(tier)}`}
    >
      {tier}
    </span>
  );
}

function RoundBadge({ round }: { round: 1 | 2 }) {
  return (
    <span
      className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
        round === 1
          ? "bg-primary/20 text-primary border border-primary/40"
          : "bg-accent/20 text-accent border border-accent/40"
      }`}
    >
      {round === 1 ? "Round 1: Primary" : "Round 2: Secondary"}
    </span>
  );
}

export function AuctionTab({ onGoToResults }: { onGoToResults: () => void }) {
  const { state, dispatch } = useApp();
  const { auction, teams, players } = state;
  const [historyOpen, setHistoryOpen] = useState(false);

  const activePlayer = auction.activePlayerId
    ? players.find((p) => p.id === auction.activePlayerId)
    : null;
  const availablePlayers = players.filter((p) => p.status === "available");
  const unsoldPlayers = players.filter((p) => p.status === "unsold");

  // Not started
  if (!auction.started) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Gavel className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Start Auction</h2>
            <RoundBadge round={1} />
          </div>
          {teams.length === 0 || availablePlayers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-2">
                Please add teams and players in Setup before starting the
                auction.
              </p>
              {teams.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  • No teams added yet
                </p>
              )}
              {availablePlayers.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  • No available players
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-5">
                {availablePlayers.length} players ready — {teams.length} teams —
                sorted Diamond → Gold → Silver
              </p>
              <Button
                data-ocid="auction.start_button"
                size="lg"
                onClick={() => dispatch({ type: "START_AUCTION" })}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8 h-12"
              >
                <Zap className="h-5 w-5 mr-2" /> Start Auction
              </Button>
              <div className="mt-6 space-y-2">
                <p className="text-sm text-muted-foreground font-medium">
                  Player Queue Preview
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availablePlayers
                    .sort(
                      (a, b) =>
                        ({ Diamond: 0, Gold: 1, Silver: 2 })[a.tier] -
                        { Diamond: 0, Gold: 1, Silver: 2 }[b.tier],
                    )
                    .slice(0, 8)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 bg-secondary rounded-lg p-2"
                      >
                        <Avatar className="h-8 w-8 rounded-md">
                          <AvatarImage src={p.photoUrl} />
                          <AvatarFallback className="text-xs bg-muted rounded-md">
                            {p.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium flex-1 truncate">
                          {p.name}
                        </span>
                        <TierBadge tier={p.tier} />
                      </div>
                    ))}
                  {availablePlayers.length > 8 && (
                    <div className="col-span-full text-center text-sm text-muted-foreground py-1">
                      +{availablePlayers.length - 8} more players
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Round complete
  if (auction.started && !auction.activePlayerId) {
    const soldCount = players.filter((p) => p.status === "sold").length;
    const unsoldCount = unsoldPlayers.length;
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-xl p-8 text-center space-y-5">
          <div className="flex justify-center">
            <Trophy className="h-16 w-16 text-accent" />
          </div>
          <h2 className="text-2xl font-bold">
            Round {auction.round} Complete!
          </h2>
          <p className="text-muted-foreground">
            {soldCount} players sold · {unsoldCount} players unsold
          </p>
          {auction.round === 1 && unsoldCount > 0 && (
            <Button
              data-ocid="auction.start_secondary_round_button"
              size="lg"
              onClick={() => dispatch({ type: "START_SECONDARY_ROUND" })}
              className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8"
            >
              <Gavel className="h-5 w-5 mr-2" /> Start Secondary Round (
              {unsoldCount} players)
            </Button>
          )}
          <Button
            data-ocid="auction.next_player_button"
            size="lg"
            variant="outline"
            onClick={onGoToResults}
            className="border-border text-foreground hover:bg-secondary text-base px-8"
          >
            <ChevronRight className="h-5 w-5 mr-2" /> View Results
          </Button>
        </div>
      </div>
    );
  }

  // Active bidding — full-screen hero layout
  if (!activePlayer) return null;
  const tierRules = TIER_RULES[activePlayer.tier];
  const nextBidAmount = getNextBid(auction.currentBid, activePlayer.tier);
  const currentBidderTeam = auction.currentBidderId
    ? teams.find((t) => t.id === auction.currentBidderId)
    : null;
  const remainingInQueue = auction.playerQueue.length;

  return (
    <div
      className="relative -mx-4 -mt-4 flex flex-col"
      style={{ minHeight: "calc(100vh - 120px)" }}
    >
      {/* ── Hero Image Area ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePlayer.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative w-full flex-shrink-0 bg-black"
          style={{ height: "65vh", minHeight: 320 }}
        >
          {/* Background image */}
          {activePlayer.photoUrl ? (
            <img
              src={activePlayer.photoUrl}
              alt={activePlayer.name}
              className="absolute inset-0 w-full h-full object-contain object-center"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
              <span className="text-8xl font-black text-foreground/20 select-none">
                {activePlayer.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}

          {/* Top overlay: round badge + queue count */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3 z-10">
            <RoundBadge round={auction.round} />
            <span className="text-xs font-semibold bg-black/50 text-white/80 px-2.5 py-1 rounded-full backdrop-blur-sm">
              {remainingInQueue} in queue
            </span>
          </div>

          {/* Bottom gradient + player info */}
          <div
            className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-5 pt-20"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
            }}
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TierBadge tier={activePlayer.tier} />
                  <span className="text-white/70 text-sm font-medium">
                    {activePlayer.specialty}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight drop-shadow-lg">
                  {activePlayer.name}
                </h2>
              </div>
              {/* Current bid bubble */}
              <div className="text-right shrink-0">
                {auction.currentBid > 0 ? (
                  <>
                    <motion.p
                      key={auction.currentBid}
                      initial={{ scale: 1.25, color: "#10b981" }}
                      animate={{ scale: 1, color: "#ffffff" }}
                      className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg leading-none"
                    >
                      {formatCurrency(auction.currentBid)}
                    </motion.p>
                    {currentBidderTeam && (
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={currentBidderTeam.logoUrl} />
                          <AvatarFallback className="text-[8px] bg-primary">
                            {currentBidderTeam.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-primary font-bold">
                          {currentBidderTeam.name}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-lg font-black text-white/50">No bids</p>
                    <p className="text-xs text-white/40">
                      Base: {formatCurrency(tierRules.basePrice)}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Compact Bottom Panel ── */}
      <div className="flex-1 bg-black/95 border-t border-white/10 backdrop-blur-sm">
        {/* Next bid + action buttons row */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">
              Next Bid
            </span>
            <span className="text-sm font-black text-accent">
              {formatCurrency(nextBidAmount)}
            </span>
            <span className="text-[10px] text-white/30">
              +{formatCurrency(tierRules.increment)}/step
            </span>
          </div>
          {/* Bid history toggle */}
          {auction.bidHistory.length > 0 && (
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 transition-colors px-2 py-1 rounded"
            >
              History{" "}
              {historyOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
            </button>
          )}
          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              data-ocid="auction.undo_bid_button"
              variant="outline"
              size="sm"
              disabled={auction.bidHistory.length === 0}
              onClick={() => dispatch({ type: "UNDO_BID" })}
              className="h-7 px-2 text-[11px] border-white/20 text-white/60 hover:text-white bg-transparent hover:bg-white/10"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Undo
            </Button>
            <Button
              data-ocid="auction.mark_unsold_button"
              variant="outline"
              size="sm"
              onClick={() => dispatch({ type: "MARK_UNSOLD" })}
              className="h-7 px-2 text-[11px] border-red-800/60 text-red-400 hover:bg-red-950 bg-transparent"
            >
              <XCircle className="h-3 w-3 mr-1" /> Unsold
            </Button>
            <Button
              data-ocid="auction.confirm_sale_button"
              size="sm"
              disabled={!auction.currentBidderId || auction.currentBid === 0}
              onClick={() => dispatch({ type: "CONFIRM_SALE" })}
              className="h-7 px-3 text-[11px] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" /> Sold!
            </Button>
          </div>
        </div>

        {/* Bid history collapsible */}
        <AnimatePresence>
          {historyOpen && auction.bidHistory.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-white/10"
            >
              <div className="px-3 py-2">
                <ScrollArea className="h-20">
                  <div className="flex gap-2">
                    {[...auction.bidHistory].reverse().map((entry, i) => {
                      const team = teams.find((t) => t.id === entry.teamId);
                      return (
                        <div
                          key={`bid-${auction.bidHistory.length - 1 - i}`}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md shrink-0 ${
                            i === 0
                              ? "bg-primary/20 border border-primary/30"
                              : "bg-white/5 border border-white/10"
                          }`}
                        >
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={team?.logoUrl} />
                            <AvatarFallback className="text-[8px] bg-muted">
                              {team?.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] text-white/70 whitespace-nowrap">
                            {team?.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold whitespace-nowrap ${i === 0 ? "text-primary" : "text-white/40"}`}
                          >
                            {formatCurrency(entry.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Bid horizontal scroll */}
        <div className="px-3 py-2">
          <p className="text-[9px] font-semibold text-white/30 uppercase tracking-widest mb-2">
            Quick Bid
          </p>
          <div
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            {teams.map((team, idx) => {
              const remaining = getRemainingBudget(team);
              const pct = Math.round((remaining / team.budget) * 100);
              const isHighest = team.id === auction.currentBidderId;
              const canAfford = remaining >= nextBidAmount;
              const disabled = !canAfford || isHighest;
              return (
                <button
                  type="button"
                  key={team.id}
                  data-ocid={`auction.quick_bid_button.${idx + 1}`}
                  disabled={disabled}
                  onClick={() =>
                    dispatch({ type: "PLACE_BID", teamId: team.id })
                  }
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-center shrink-0 ${
                    isHighest
                      ? "border-primary bg-primary/20 ring-1 ring-primary"
                      : disabled
                        ? "border-white/10 bg-white/5 opacity-40 cursor-not-allowed"
                        : "border-white/15 bg-white/8 hover:border-primary hover:bg-primary/10 cursor-pointer active:scale-95"
                  }`}
                  style={{ width: 76, minWidth: 76 }}
                >
                  {isHighest && (
                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[8px] font-black px-1 py-0.5 rounded-full leading-none z-10">
                      LEAD
                    </span>
                  )}
                  <Avatar className="h-8 w-8 rounded-md">
                    <AvatarImage src={team.logoUrl} />
                    <AvatarFallback className="text-[10px] bg-white/10 rounded-md font-bold text-white">
                      {team.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-[10px] font-semibold leading-tight truncate w-full text-white/80">
                    {team.name}
                  </p>
                  <Progress value={pct} className="h-0.5 w-full" />
                  <p
                    className={`text-[9px] font-bold leading-none ${
                      isHighest
                        ? "text-primary"
                        : canAfford
                          ? "text-accent"
                          : "text-white/30"
                    }`}
                  >
                    {formatCurrency(remaining)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
