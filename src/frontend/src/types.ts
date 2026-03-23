export interface Tournament {
  name: string;
  logoUrl: string;
}

export interface Team {
  id: string;
  name: string;
  logoUrl: string;
  budget: number;
  spent: number;
}

export type Specialty = "Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper";
export type Tier = "Diamond" | "Gold" | "Silver";
export type PlayerStatus = "available" | "sold" | "unsold";

export interface Player {
  id: string;
  name: string;
  specialty: Specialty;
  tier: Tier;
  photoUrl: string;
  status: PlayerStatus;
  soldToTeamId?: string;
  soldPrice?: number;
}

export interface BidEntry {
  teamId: string;
  amount: number;
}

export interface AuctionState {
  round: 1 | 2;
  started: boolean;
  activePlayerId: string | null;
  currentBid: number;
  currentBidderId: string | null;
  bidHistory: BidEntry[];
  playerQueue: string[];
}

export type TierPricing = {
  basePrice: number;
  increment: number;
};

export const DEFAULT_TIER_RULES: Record<Tier, TierPricing> = {
  Diamond: { basePrice: 5000, increment: 500 },
  Gold: { basePrice: 3000, increment: 500 },
  Silver: { basePrice: 1500, increment: 500 },
};

export const DEFAULT_TIER_NAMES: Record<Tier, string> = {
  Diamond: "Diamond",
  Gold: "Gold",
  Silver: "Silver",
};

// Keep for backward compat
export const TIER_RULES = DEFAULT_TIER_RULES;

export interface AppState {
  tournament: Tournament;
  teams: Team[];
  players: Player[];
  auction: AuctionState;
  tierPricing: Record<Tier, TierPricing>;
  tierNames: Record<Tier, string>;
}

export type Action =
  | { type: "SET_TOURNAMENT"; tournament: Tournament }
  | { type: "SET_TIER_PRICING"; tierPricing: Record<Tier, TierPricing> }
  | { type: "SET_TIER_NAMES"; tierNames: Record<Tier, string> }
  | { type: "ADD_TEAM"; team: Team }
  | { type: "UPDATE_TEAM"; team: Team }
  | { type: "DELETE_TEAM"; teamId: string }
  | { type: "ADD_PLAYER"; player: Player }
  | { type: "UPDATE_PLAYER"; player: Player }
  | { type: "DELETE_PLAYER"; playerId: string }
  | { type: "BULK_ADD_PLAYERS"; players: Player[] }
  | { type: "START_AUCTION" }
  | { type: "PLACE_BID"; teamId: string }
  | { type: "UNDO_BID" }
  | { type: "CONFIRM_SALE" }
  | { type: "MARK_UNSOLD" }
  | { type: "START_SECONDARY_ROUND" }
  | { type: "RESET_AUCTION" }
  | { type: "NEW_TOURNAMENT" }
  | { type: "LOAD_BACKUP"; state: AppState };

export const SPECIALTIES: Specialty[] = [
  "Batsman",
  "Bowler",
  "All-Rounder",
  "Wicket-Keeper",
];
export const TIERS: Tier[] = ["Diamond", "Gold", "Silver"];

export function formatCurrency(amount: number): string {
  return `\u20B9${amount.toLocaleString("en-IN")}`;
}

export function getRemainingBudget(team: Team): number {
  return team.budget - team.spent;
}

export function getNextBid(
  currentBid: number,
  tier: Tier,
  pricing?: Record<Tier, TierPricing>,
): number {
  const rules = pricing ? pricing[tier] : DEFAULT_TIER_RULES[tier];
  return currentBid === 0 ? rules.basePrice : currentBid + rules.increment;
}

export function getTierClasses(tier: Tier): string {
  switch (tier) {
    case "Diamond":
      return "text-blue-300 bg-blue-950 border border-blue-700";
    case "Gold":
      return "text-amber-300 bg-amber-950 border border-amber-700";
    case "Silver":
      return "text-slate-300 bg-slate-800 border border-slate-600";
  }
}

export function getTierGlow(tier: Tier): string {
  switch (tier) {
    case "Diamond":
      return "shadow-[0_0_20px_rgba(59,130,246,0.3)]";
    case "Gold":
      return "shadow-[0_0_20px_rgba(245,158,11,0.3)]";
    case "Silver":
      return "shadow-[0_0_20px_rgba(148,163,184,0.2)]";
  }
}

export function getStatusClasses(status: PlayerStatus): string {
  switch (status) {
    case "sold":
      return "text-emerald-400 bg-emerald-950 border border-emerald-700";
    case "unsold":
      return "text-red-400 bg-red-950 border border-red-700";
    case "available":
      return "text-gray-400 bg-gray-800 border border-gray-600";
  }
}
