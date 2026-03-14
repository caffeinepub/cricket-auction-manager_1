# Cricket Auction Manager

## Current State
- Tournament branding (name, logo), team management, player management (name, tier, specialty, photo)
- Tiered auction with hardcoded TIER_RULES: Diamond ₹2000/₹1000, Gold ₹1500/₹500, Silver ₹1000/₹500
- Auction starts and queues all available players sorted Diamond→Gold→Silver
- Quick Bid buttons for all teams, undo bid, mark unsold, confirm sale
- Round 2 for unsold players
- Results tab showing team rosters and unsold players
- All data stored in localStorage

## Requested Changes (Diff)

### Add
- `tierPricing` field in AppState: `{ Diamond: { basePrice, increment }, Gold: { basePrice, increment }, Silver: { basePrice, increment } }`
- `SET_TIER_PRICING` reducer action
- Pricing configuration UI in Setup > Tournament tab: 3 rows (Diamond/Gold/Silver), each with Base Price input and Bid Increment input
- Save Pricing button in tournament section
- Auction phase indicator during bidding showing which tier phase is active (Phase 1: Diamond, Phase 2: Gold, Phase 3: Silver)
- "End Auction" button in the round-complete screen — blocked with warning if any team has fewer than 11 players, otherwise navigates to Results
- Team squad view in ResultsTab: each team card shows the team logo as a faded background image behind the player roster

### Modify
- Remove hardcoded TIER_RULES constants from types.ts; replace all references to use `state.tierPricing` (with fallback defaults)
- `getNextBid` and `PLACE_BID` logic to read from `state.tierPricing` rather than static TIER_RULES
- AuctionTab start screen to show per-tier base prices from `state.tierPricing`
- START_AUCTION action already sorts Diamond→Gold→Silver (correct, keep)
- Round-complete screen to enforce minimum 11 players per team before allowing "End Auction / View Results"

### Remove
- Hardcoded `TIER_RULES` object (or keep as DEFAULT_TIER_RULES fallback only if tierPricing not set)

## Implementation Plan
1. Update `types.ts`: add `TierPricing` type, add `tierPricing` to `AppState`, export `DEFAULT_TIER_RULES` as fallback
2. Update `AppContext.tsx`: initialize `tierPricing` in `INITIAL_STATE` with defaults, add `SET_TIER_PRICING` case, update `PLACE_BID` and `START_AUCTION` to read from `state.tierPricing`
3. Update `SetupTab.tsx`: add pricing config section in Tournament tab with inputs for base price and increment per tier
4. Update `AuctionTab.tsx`:
   - In the not-started screen, show per-tier prices from `state.tierPricing`
   - In active bidding, show phase badge (Phase 1 Diamond / Phase 2 Gold / Phase 3 Silver) based on `activePlayer.tier`
   - In round-complete screen, add minimum 11 check: count teams with fewer than 11 players, show warning, block "View Results" if enforcement needed
5. Update `ResultsTab.tsx`: team squad cards show team logo as faded background image
