# Cricket Auction Manager

## Current State
Full-featured offline cricket auction manager with Setup, Auction, and Results tabs. Auction start flow exists but has bugs that prevent proper operation in certain states.

## Requested Changes (Diff)

### Add
- "Reset Players & Restart" button on Auction tab when all players are sold/unsold (stuck state)
- Clear error messages explaining exactly what's missing before auction can start

### Modify
- Fix `CONFIRM_SALE` logic: allow confirming sale when a bidder exists (remove overly strict `currentBid === 0` guard that can block valid sales at base price with 0-value configs)
- Fix Auction tab stuck state: when `auction.started = true` but `activePlayerId = null` and there are still available players (e.g. after partial reset), auto-advance or show a Resume button
- Fix player queue stuck state: if all players are sold/unsold but auction shows as started with no active player, offer to go to results or start secondary round
- Improve Start Auction pre-flight check: show specifically what's missing (no teams, no available players, players all sold already)
- Add "Reset Auction" button directly on Auction tab (not just Results) so users aren't stuck

### Remove
- Nothing

## Implementation Plan
1. In AppContext reducer, fix edge cases in START_AUCTION and CONFIRM_SALE
2. In AuctionTab, add better pre-flight error messages and a reset/restart option when stuck
3. Add a Resume button if auction started but activePlayerId is null but available players exist
4. Ensure the round-complete screen correctly shows secondary round option only when unsold players exist
