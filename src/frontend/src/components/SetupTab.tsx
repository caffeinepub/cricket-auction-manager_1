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
import { Edit2, Plus, Trash2, Trophy, UserRound, Users } from "lucide-react";
import { useState } from "react";
import { useApp } from "../store/AppContext";
import {
  type Player,
  SPECIALTIES,
  type Specialty,
  TIERS,
  type Team,
  type Tier,
  formatCurrency,
  getRemainingBudget,
  getStatusClasses,
  getTierClasses,
} from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import { ImageUpload } from "./ImageUpload";

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getTierClasses(tier)}`}
    >
      {tier}
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

  function save() {
    dispatch({ type: "SET_TOURNAMENT", tournament: { name, logoUrl } });
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
        <Button
          data-ocid="setup.save_tournament_button"
          onClick={save}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Save Tournament
        </Button>
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
                  <TierBadge tier={tier} />
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {TIERS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
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
