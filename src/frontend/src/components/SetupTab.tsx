import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Edit2,
  FileSpreadsheet,
  FolderOpen,
  HardDrive,
  Plus,
  Trash2,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { loadBackup, saveBackup } from "../hooks/useBackup";
import { useApp } from "../store/AppContext";
import {
  type Player,
  SPECIALTIES,
  type Specialty,
  TIERS,
  type Team,
  type Tier,
  type TierPricing,
  formatCurrency,
  getRemainingBudget,
  getStatusClasses,
  getTierClasses,
} from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import { ImageUpload } from "./ImageUpload";

function TierBadge({ tier, label }: { tier: Tier; label?: string }) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getTierClasses(tier)}`}
    >
      {label ?? tier}
    </span>
  );
}

function StatusBadge({ status }: { status: Player["status"] }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusClasses(status)}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Tournament Section ────────────────────────────────────────────────────
function TournamentSection() {
  const { state, dispatch } = useApp();
  const [name, setName] = useState(state.tournament.name);
  const [logoUrl, setLogoUrl] = useState(state.tournament.logoUrl);
  const [pricing, setPricing] = useState<Record<Tier, TierPricing>>(
    state.tierPricing,
  );
  const [tierNamesLocal, setTierNamesLocal] = useState<Record<Tier, string>>(
    state.tierNames,
  );
  const backupFileRef = useRef<HTMLInputElement | null>(null);
  const [loadConfirmOpen, setLoadConfirmOpen] = useState(false);
  const [pendingState, setPendingState] = useState<
    import("../types").AppState | null
  >(null);

  function updatePricing(tier: Tier, field: keyof TierPricing, raw: string) {
    const val = Number.parseInt(raw, 10);
    setPricing((prev) => ({
      ...prev,
      [tier]: { ...prev[tier], [field]: Number.isNaN(val) ? 0 : val },
    }));
  }

  function save() {
    dispatch({ type: "SET_TOURNAMENT", tournament: { name, logoUrl } });
    dispatch({ type: "SET_TIER_PRICING", tierPricing: pricing });
    dispatch({ type: "SET_TIER_NAMES", tierNames: tierNamesLocal });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-bold text-foreground">
          Tournament Branding
        </h2>
      </div>
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">
            Tournament Name
          </Label>
          <Input
            data-ocid="setup.tournament_name_input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Premier Cricket League 2026"
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">
            Tournament Logo
          </Label>
          <ImageUpload
            value={logoUrl}
            onChange={setLogoUrl}
            label="Upload Logo"
            dataOcid="setup.tournament_logo_upload"
            maxDim={400}
            size="lg"
            fallback="T"
          />
        </div>

        {/* Auction Pricing */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">
              Auction Pricing &amp; Tier Names
            </h3>
            <span className="text-xs text-muted-foreground">
              — configurable per tournament
            </span>
          </div>
          <div className="bg-secondary/50 border border-border rounded-lg p-3 space-y-3">
            {/* Header row */}
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] gap-3 items-center">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Tier
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Display Name
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Base Price (₹)
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Bid Increment (₹)
              </span>
            </div>
            {TIERS.map((tier) => (
              <div
                key={tier}
                className="grid grid-cols-[140px_1fr_1fr_1fr] gap-3 items-center"
              >
                <TierBadge tier={tier} label={tierNamesLocal[tier]} />
                <Input
                  data-ocid={`setup.${tier.toLowerCase()}_tier_name_input`}
                  value={tierNamesLocal[tier]}
                  onChange={(e) =>
                    setTierNamesLocal((prev) => ({
                      ...prev,
                      [tier]: e.target.value,
                    }))
                  }
                  placeholder={tier}
                  className="bg-card border-border text-foreground h-8 text-sm"
                />
                <Input
                  data-ocid={`setup.${tier.toLowerCase()}_base_price_input`}
                  type="number"
                  min={0}
                  step={100}
                  value={pricing[tier].basePrice}
                  onChange={(e) =>
                    updatePricing(tier, "basePrice", e.target.value)
                  }
                  className="bg-card border-border text-foreground h-8 text-sm"
                />
                <Input
                  data-ocid={`setup.${tier.toLowerCase()}_increment_input`}
                  type="number"
                  min={0}
                  step={100}
                  value={pricing[tier].increment}
                  onChange={(e) =>
                    updatePricing(tier, "increment", e.target.value)
                  }
                  className="bg-card border-border text-foreground h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <Button
          data-ocid="setup.save_tournament_button"
          onClick={save}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Save Tournament
        </Button>
        <div className="flex items-center gap-2 pt-1">
          <Button
            data-ocid="setup.save_backup_button"
            variant="outline"
            size="sm"
            onClick={() => saveBackup(state)}
            className="border-border text-muted-foreground hover:text-foreground flex-1"
          >
            <HardDrive className="h-4 w-4 mr-1.5" /> Save Backup
          </Button>
          <Button
            data-ocid="setup.load_backup_button"
            variant="outline"
            size="sm"
            onClick={() =>
              loadBackup(
                backupFileRef,
                (parsed) => {
                  setPendingState(parsed);
                  setLoadConfirmOpen(true);
                },
                (msg) => toast.error(msg),
              )
            }
            className="border-border text-muted-foreground hover:text-foreground flex-1"
          >
            <FolderOpen className="h-4 w-4 mr-1.5" /> Load Backup
          </Button>
        </div>
        <input
          ref={backupFileRef}
          type="file"
          accept=".json"
          className="hidden"
        />
        <ConfirmDialog
          open={loadConfirmOpen}
          onOpenChange={setLoadConfirmOpen}
          title="Load Backup"
          description="This will replace ALL current data including teams, players, and auction state. This cannot be undone."
          confirmLabel="Load Backup"
          destructive
          onConfirm={() => {
            if (pendingState) {
              dispatch({ type: "LOAD_BACKUP", state: pendingState });
              toast.success("Backup loaded successfully.");
            }
            setLoadConfirmOpen(false);
            setPendingState(null);
          }}
        />
      </div>
    </div>
  );
}

// ─── Teams Section ─────────────────────────────────────────────────────────
interface TeamFormState {
  id?: string;
  name: string;
  logoUrl: string;
}

function TeamsSection() {
  const { state, dispatch } = useApp();
  const [dialog, setDialog] = useState<{ open: boolean; editing?: Team }>({
    open: false,
  });
  const [form, setForm] = useState<TeamFormState>({ name: "", logoUrl: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openAdd() {
    setForm({ name: "", logoUrl: "" });
    setDialog({ open: true });
  }

  function openEdit(team: Team) {
    setForm({ id: team.id, name: team.name, logoUrl: team.logoUrl });
    setDialog({ open: true, editing: team });
  }

  function save() {
    if (!form.name.trim()) return;
    if (form.id) {
      const existing = state.teams.find((t) => t.id === form.id);
      if (existing) {
        dispatch({
          type: "UPDATE_TEAM",
          team: { ...existing, name: form.name.trim(), logoUrl: form.logoUrl },
        });
      }
    } else {
      dispatch({
        type: "ADD_TEAM",
        team: {
          id: crypto.randomUUID(),
          name: form.name.trim(),
          logoUrl: form.logoUrl,
          budget: 100000,
          spent: 0,
        },
      });
    }
    setDialog({ open: false });
  }

  const canAdd = state.teams.length < 16;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold text-foreground">Teams</h2>
          <Badge
            variant="outline"
            className="text-muted-foreground border-border"
          >
            {state.teams.length} / 16
          </Badge>
        </div>
        <Button
          data-ocid="setup.add_team_button"
          onClick={openAdd}
          disabled={!canAdd}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Team
        </Button>
      </div>

      {state.teams.length === 0 ? (
        <div
          data-ocid="teams.empty_state"
          className="bg-card border border-dashed border-border rounded-lg p-10 text-center"
        >
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            No teams yet. Add up to 16 teams.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {state.teams.map((team, idx) => {
            const remaining = getRemainingBudget(team);
            const pct = Math.round((remaining / team.budget) * 100);
            return (
              <div
                key={team.id}
                data-ocid={`teams.item.${idx + 1}`}
                className="bg-card border border-border rounded-lg p-4 flex items-center gap-4"
              >
                <Avatar className="h-12 w-12 rounded-md border border-border">
                  <AvatarImage src={team.logoUrl} />
                  <AvatarFallback className="bg-secondary text-muted-foreground text-sm rounded-md">
                    {team.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {team.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatCurrency(remaining)} left
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(team)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(team.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o })}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {dialog.editing ? "Edit Team" : "Add Team"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Team Name</Label>
              <Input
                data-ocid="setup.team_name_input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Rajasthan Royals"
                className="bg-secondary border-border"
                onKeyDown={(e) => e.key === "Enter" && save()}
              />
            </div>
            <div className="space-y-2">
              <Label>Team Logo</Label>
              <ImageUpload
                value={form.logoUrl}
                onChange={(v) => setForm((f) => ({ ...f, logoUrl: v }))}
                label="Upload Logo"
                dataOcid="setup.team_logo_upload"
                maxDim={200}
                fallback={form.name.slice(0, 2).toUpperCase() || "?"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog({ open: false })}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              data-ocid="setup.save_team_button"
              onClick={save}
              disabled={!form.name.trim()}
              className="bg-primary text-primary-foreground"
            >
              {dialog.editing ? "Save Changes" : "Add Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Team"
        description="Are you sure you want to delete this team? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) dispatch({ type: "DELETE_TEAM", teamId: deleteId });
          setDeleteId(null);
        }}
        destructive
      />
    </div>
  );
}

// ─── Bulk Import Section ───────────────────────────────────────────────────
interface ImportResult {
  imported: number;
  skipped: { row: number; sheet: string; reason: string }[];
}

function BulkImportSection() {
  const { state, dispatch } = useApp();
  const { tierNames } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showSkipped, setShowSkipped] = useState(false);

  function downloadTemplate() {
    const wb = XLSX.utils.book_new();
    const sampleRows = [
      ["Name", "Specialty"],
      ["Sample Player 1", "Batsman"],
      ["Sample Player 2", "Bowler"],
      ["Sample Player 3", "All-Rounder"],
    ];
    for (const tier of TIERS) {
      const ws = XLSX.utils.aoa_to_sheet(sampleRows);
      XLSX.utils.book_append_sheet(wb, ws, tierNames[tier]);
    }
    XLSX.writeFile(wb, "player_import_template.xlsx");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: "array" });

        const validPlayers: Player[] = [];
        const skippedRows: { row: number; sheet: string; reason: string }[] =
          [];

        // Build reverse map: displayName (lowercase) -> Tier key
        const nameToTier: Record<string, Tier> = {};
        for (const tier of TIERS) {
          nameToTier[tierNames[tier].toLowerCase()] = tier;
        }

        for (const sheetName of wb.SheetNames) {
          const matchedTier = nameToTier[sheetName.toLowerCase()];
          if (!matchedTier) {
            skippedRows.push({
              row: 0,
              sheet: sheetName,
              reason: `Sheet "${sheetName}" does not match any tier name`,
            });
            continue;
          }

          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(ws, {
            header: 1,
            defval: "",
          }) as unknown as unknown[][];

          // Skip header row (index 0), process from index 1
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const nameCell = String(row[0] ?? "").trim();
            const specialtyCell = String(row[1] ?? "").trim();

            if (!nameCell) {
              skippedRows.push({
                row: i + 1,
                sheet: sheetName,
                reason: "Missing name",
              });
              continue;
            }

            const specialty: Specialty = (SPECIALTIES as string[]).includes(
              specialtyCell,
            )
              ? (specialtyCell as Specialty)
              : "Batsman";

            validPlayers.push({
              id: crypto.randomUUID(),
              name: nameCell,
              specialty,
              tier: matchedTier,
              photoUrl: "",
              status: "available",
            });
          }
        }

        if (validPlayers.length > 0) {
          dispatch({ type: "BULK_ADD_PLAYERS", players: validPlayers });
        }

        setResult({ imported: validPlayers.length, skipped: skippedRows });
        setShowSkipped(false);
      } catch (err) {
        console.error("Excel parse error", err);
        setResult({
          imported: 0,
          skipped: [
            {
              row: 0,
              sheet: "—",
              reason:
                "Failed to parse file. Make sure it is a valid .xlsx or .xls file.",
            },
          ],
        });
      }
    };
    reader.readAsArrayBuffer(file);

    // Reset file input so same file can be re-imported if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const rowSkips = result?.skipped.filter((s) => s.row > 0) ?? [];
  const sheetSkips = result?.skipped.filter((s) => s.row === 0) ?? [];

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-bold text-foreground">
          Bulk Import via Excel
        </h3>
        <span className="text-xs text-muted-foreground">
          — one sheet per tier
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          data-ocid="bulk_import.download_template_button"
          variant="outline"
          size="sm"
          onClick={downloadTemplate}
          className="border-border text-muted-foreground hover:text-foreground gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Download Template
        </Button>

        <Button
          data-ocid="bulk_import.upload_button"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Import Excel
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Result feedback */}
      {result !== null && (
        <div className="space-y-2">
          {result.imported > 0 && (
            <div
              data-ocid="bulk_import.success_state"
              className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-950/50 border border-emerald-800 rounded-md px-3 py-2"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                <strong>{result.imported}</strong> player
                {result.imported !== 1 ? "s" : ""} imported successfully
              </span>
            </div>
          )}

          {result.imported === 0 && result.skipped.length === 0 && (
            <div className="text-sm text-muted-foreground px-1">
              No players found in the file.
            </div>
          )}

          {(rowSkips.length > 0 || sheetSkips.length > 0) && (
            <div
              data-ocid="bulk_import.error_state"
              className="bg-amber-950/50 border border-amber-800 rounded-md px-3 py-2 space-y-1"
            >
              <button
                type="button"
                onClick={() => setShowSkipped((v) => !v)}
                className="flex items-center gap-2 text-sm text-amber-400 w-full text-left"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  {result.skipped.length} row
                  {result.skipped.length !== 1 ? "s" : ""} were skipped
                </span>
                {showSkipped ? (
                  <ChevronUp className="h-3.5 w-3.5 ml-auto" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 ml-auto" />
                )}
              </button>

              {showSkipped && (
                <ul className="mt-1 space-y-0.5 text-xs text-amber-300/80 pl-6 max-h-32 overflow-y-auto">
                  {sheetSkips.map((s) => (
                    <li key={s.sheet}>
                      Sheet "{s.sheet}": {s.reason}
                    </li>
                  ))}
                  {rowSkips.map((s) => (
                    <li key={`${s.sheet}-${s.row}`}>
                      Sheet "{s.sheet}" Row {s.row}: {s.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Players Section ───────────────────────────────────────────────────────
interface PlayerFormState {
  id?: string;
  name: string;
  specialty: Specialty;
  tier: Tier;
  photoUrl: string;
}

const DEFAULT_PLAYER_FORM: PlayerFormState = {
  name: "",
  specialty: "Batsman",
  tier: "Gold",
  photoUrl: "",
};

function PlayersSection() {
  const { state, dispatch } = useApp();
  const { tierNames } = state;
  const [dialog, setDialog] = useState<{ open: boolean; editing?: Player }>({
    open: false,
  });
  const [form, setForm] = useState<PlayerFormState>(DEFAULT_PLAYER_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openAdd() {
    setForm(DEFAULT_PLAYER_FORM);
    setDialog({ open: true });
  }

  function openEdit(player: Player) {
    setForm({
      id: player.id,
      name: player.name,
      specialty: player.specialty,
      tier: player.tier,
      photoUrl: player.photoUrl,
    });
    setDialog({ open: true, editing: player });
  }

  function save() {
    if (!form.name.trim()) return;
    if (form.id) {
      const existing = state.players.find((p) => p.id === form.id);
      if (existing) {
        dispatch({
          type: "UPDATE_PLAYER",
          player: {
            ...existing,
            name: form.name.trim(),
            specialty: form.specialty,
            tier: form.tier,
            photoUrl: form.photoUrl,
          },
        });
      }
    } else {
      dispatch({
        type: "ADD_PLAYER",
        player: {
          id: crypto.randomUUID(),
          name: form.name.trim(),
          specialty: form.specialty,
          tier: form.tier,
          photoUrl: form.photoUrl,
          status: "available",
        },
      });
    }
    setDialog({ open: false });
  }

  const grouped: Record<Tier, Player[]> = { Diamond: [], Gold: [], Silver: [] };
  for (const p of state.players) grouped[p.tier].push(p);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserRound className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold text-foreground">Players</h2>
          <Badge
            variant="outline"
            className="text-muted-foreground border-border"
          >
            {state.players.length}
          </Badge>
        </div>
        <Button
          data-ocid="setup.add_player_button"
          onClick={openAdd}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Player
        </Button>
      </div>

      {/* Bulk Import at top of Players section */}
      <BulkImportSection />

      {state.players.length === 0 ? (
        <div
          data-ocid="players.empty_state"
          className="bg-card border border-dashed border-border rounded-lg p-10 text-center"
        >
          <UserRound className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            No players yet. Add players to auction.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {TIERS.map((tier) => {
            const players = grouped[tier];
            if (players.length === 0) return null;
            return (
              <div key={tier}>
                <div className="flex items-center gap-2 mb-3">
                  <TierBadge tier={tier} label={tierNames[tier]} />
                  <span className="text-muted-foreground text-sm">
                    {players.length} players
                  </span>
                  <Separator className="flex-1 bg-border" />
                </div>
                <div className="grid gap-2">
                  {players.map((player, idx) => (
                    <div
                      key={player.id}
                      data-ocid={`players.item.${idx + 1}`}
                      className="bg-card border border-border rounded-lg p-3 flex items-center gap-3"
                    >
                      <Avatar className="h-10 w-10 rounded-md border border-border">
                        <AvatarImage src={player.photoUrl} />
                        <AvatarFallback className="bg-secondary text-xs rounded-md">
                          {player.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {player.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {player.specialty}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={player.status} />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(player)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(player.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o })}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {dialog.editing ? "Edit Player" : "Add Player"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Player Name</Label>
              <Input
                data-ocid="setup.player_name_input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Virat Kohli"
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Select
                  value={form.specialty}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, specialty: v as Specialty }))
                  }
                >
                  <SelectTrigger
                    data-ocid="setup.player_specialty_select"
                    className="bg-secondary border-border"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tier</Label>
                <Select
                  value={form.tier}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, tier: v as Tier }))
                  }
                >
                  <SelectTrigger
                    data-ocid="setup.player_tier_select"
                    className="bg-secondary border-border"
                  >
                    <SelectValue placeholder={tierNames[form.tier]} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {TIERS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {tierNames[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Player Photo</Label>
              <ImageUpload
                value={form.photoUrl}
                onChange={(v) => setForm((f) => ({ ...f, photoUrl: v }))}
                label="Upload Photo"
                dataOcid="setup.player_photo_upload"
                maxDim={300}
                fallback={form.name.slice(0, 2).toUpperCase() || "?"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog({ open: false })}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              data-ocid="setup.save_player_button"
              onClick={save}
              disabled={!form.name.trim()}
              className="bg-primary text-primary-foreground"
            >
              {dialog.editing ? "Save Changes" : "Add Player"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Player"
        description="Are you sure you want to delete this player?"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) dispatch({ type: "DELETE_PLAYER", playerId: deleteId });
          setDeleteId(null);
        }}
        destructive
      />
    </div>
  );
}

// ─── Main SetupTab ─────────────────────────────────────────────────────────
export function SetupTab() {
  return (
    <div className="max-w-3xl mx-auto">
      <Tabs defaultValue="tournament">
        <TabsList className="bg-secondary border border-border w-full grid grid-cols-3 mb-6">
          <TabsTrigger
            value="tournament"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Tournament
          </TabsTrigger>
          <TabsTrigger
            value="teams"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Teams
          </TabsTrigger>
          <TabsTrigger
            value="players"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Players
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tournament">
          <TournamentSection />
        </TabsContent>
        <TabsContent value="teams">
          <TeamsSection />
        </TabsContent>
        <TabsContent value="players">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="pr-2">
              <PlayersSection />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
