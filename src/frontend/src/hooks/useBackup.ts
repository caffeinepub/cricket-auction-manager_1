import type { Dispatch } from "react";
import type { Action, AppState } from "../types";
import { DEFAULT_TIER_NAMES, DEFAULT_TIER_RULES } from "../types";

function migrateState(parsed: AppState): AppState {
  if (!parsed.tierPricing) {
    parsed.tierPricing = DEFAULT_TIER_RULES;
  }
  if (!parsed.tierNames) {
    parsed.tierNames = DEFAULT_TIER_NAMES;
  }
  return parsed;
}

export function saveBackup(state: AppState): void {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const name = state.tournament?.name?.trim()
    ? state.tournament.name.replace(/[^a-z0-9_\-]/gi, "_")
    : "tournament";
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `cricket_backup_${name}_${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function loadBackup(
  fileRef: React.RefObject<HTMLInputElement | null>,
  onParsed: (state: AppState) => void,
  onError: (msg: string) => void,
): void {
  const input = fileRef.current;
  if (!input) return;
  // Reset so same file can be re-loaded
  input.value = "";
  const handler = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as AppState;
        if (!parsed.teams || !parsed.players || !parsed.tournament) {
          onError("Invalid backup file: missing required data.");
          return;
        }
        onParsed(migrateState(parsed));
      } catch {
        onError(
          "Failed to parse backup file. Make sure it is a valid JSON backup.",
        );
      }
    };
    reader.readAsText(file);
    input.removeEventListener("change", handler);
  };
  input.addEventListener("change", handler);
  input.click();
}

export function dispatchLoadBackup(
  dispatch: Dispatch<Action>,
  state: AppState,
): void {
  dispatch({ type: "LOAD_BACKUP", state });
}
