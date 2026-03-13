import {
  type Dispatch,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";
import type { Action, AppState, Tier } from "../types";
import { TIER_RULES } from "../types";

const STORAGE_KEY = "cricket_auction_data";

const INITIAL_AUCTION: AppState["auction"] = {
  round: 1,
  started: false,
  activePlayerId: null,
  currentBid: 0,
  currentBidderId: null,
  bidHistory: [],
  playerQueue: [],
};

const INITIAL_STATE: AppState = {
  tournament: { name: "", logoUrl: "" },
  teams: [],
  players: [],
  auction: INITIAL_AUCTION,
};

function advanceToNextPlayer(state: AppState): AppState {
  const { auction } = state;
  if (auction.playerQueue.length === 0) {
    return {
      ...state,
      auction: {
        ...auction,
        activePlayerId: null,
        currentBid: 0,
        currentBidderId: null,
        bidHistory: [],
      },
    };
  }
  const [next, ...rest] = auction.playerQueue;
  return {
    ...state,
    auction: {
      ...auction,
      activePlayerId: next,
      playerQueue: rest,
      currentBid: 0,
      currentBidderId: null,
      bidHistory: [],
    },
  };
}

const TIER_ORDER: Record<Tier, number> = { Diamond: 0, Gold: 1, Silver: 2 };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_TOURNAMENT":
      return { ...state, tournament: action.tournament };

    case "ADD_TEAM":
      return { ...state, teams: [...state.teams, action.team] };

    case "UPDATE_TEAM":
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === action.team.id ? action.team : t,
        ),
      };

    case "DELETE_TEAM":
      return {
        ...state,
        teams: state.teams.filter((t) => t.id !== action.teamId),
      };

    case "ADD_PLAYER":
      return { ...state, players: [...state.players, action.player] };

    case "UPDATE_PLAYER":
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.player.id ? action.player : p,
        ),
      };

    case "DELETE_PLAYER":
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.playerId),
      };

    case "START_AUCTION": {
      const queue = state.players
        .filter((p) => p.status === "available")
        .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier])
        .map((p) => p.id);
      if (queue.length === 0) return state;
      const [first, ...rest] = queue;
      return {
        ...state,
        auction: {
          round: 1,
          started: true,
          activePlayerId: first,
          currentBid: 0,
          currentBidderId: null,
          bidHistory: [],
          playerQueue: rest,
        },
      };
    }

    case "PLACE_BID": {
      const { auction, players } = state;
      if (!auction.activePlayerId) return state;
      const player = players.find((p) => p.id === auction.activePlayerId);
      if (!player) return state;
      const rules = TIER_RULES[player.tier];
      const nextBid =
        auction.currentBid === 0
          ? rules.basePrice
          : auction.currentBid + rules.increment;
      return {
        ...state,
        auction: {
          ...auction,
          currentBid: nextBid,
          currentBidderId: action.teamId,
          bidHistory: [
            ...auction.bidHistory,
            { teamId: action.teamId, amount: nextBid },
          ],
        },
      };
    }

    case "UNDO_BID": {
      const { auction } = state;
      if (auction.bidHistory.length === 0) return state;
      const newHistory = auction.bidHistory.slice(0, -1);
      const lastEntry = newHistory[newHistory.length - 1];
      return {
        ...state,
        auction: {
          ...auction,
          bidHistory: newHistory,
          currentBid: lastEntry ? lastEntry.amount : 0,
          currentBidderId: lastEntry ? lastEntry.teamId : null,
        },
      };
    }

    case "CONFIRM_SALE": {
      const { auction, players, teams } = state;
      if (
        !auction.activePlayerId ||
        !auction.currentBidderId ||
        auction.currentBid === 0
      )
        return state;
      const bidderId = auction.currentBidderId;
      const bid = auction.currentBid;
      const updatedPlayers = players.map((p) =>
        p.id === auction.activePlayerId
          ? {
              ...p,
              status: "sold" as const,
              soldToTeamId: bidderId,
              soldPrice: bid,
            }
          : p,
      );
      const updatedTeams = teams.map((t) =>
        t.id === bidderId ? { ...t, spent: t.spent + bid } : t,
      );
      return advanceToNextPlayer({
        ...state,
        players: updatedPlayers,
        teams: updatedTeams,
      });
    }

    case "MARK_UNSOLD": {
      const { auction, players } = state;
      if (!auction.activePlayerId) return state;
      const updatedPlayers = players.map((p) =>
        p.id === auction.activePlayerId
          ? { ...p, status: "unsold" as const }
          : p,
      );
      return advanceToNextPlayer({ ...state, players: updatedPlayers });
    }

    case "START_SECONDARY_ROUND": {
      const unsoldIds = state.players
        .filter((p) => p.status === "unsold")
        .map((p) => p.id);
      if (unsoldIds.length === 0) return state;
      const updatedPlayers = state.players.map((p) =>
        p.status === "unsold"
          ? {
              ...p,
              status: "available" as const,
              soldToTeamId: undefined,
              soldPrice: undefined,
            }
          : p,
      );
      const [first, ...rest] = unsoldIds;
      return {
        ...state,
        players: updatedPlayers,
        auction: {
          round: 2,
          started: true,
          activePlayerId: first,
          currentBid: 0,
          currentBidderId: null,
          bidHistory: [],
          playerQueue: rest,
        },
      };
    }

    case "RESET_AUCTION": {
      const resetPlayers = state.players.map((p) => ({
        ...p,
        status: "available" as const,
        soldToTeamId: undefined,
        soldPrice: undefined,
      }));
      const resetTeams = state.teams.map((t) => ({ ...t, spent: 0 }));
      return {
        ...state,
        players: resetPlayers,
        teams: resetTeams,
        auction: INITIAL_AUCTION,
      };
    }

    case "NEW_TOURNAMENT":
      return INITIAL_STATE;

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as AppState) : INITIAL_STATE;
    } catch {
      return INITIAL_STATE;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      console.warn("localStorage quota exceeded");
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
