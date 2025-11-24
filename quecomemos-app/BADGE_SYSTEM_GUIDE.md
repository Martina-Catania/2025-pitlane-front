# Badge Achievement System - Implementation Guide

## Overview
This system provides a scalable badge achievement infrastructure with automatic notifications when users earn new badges.

## Key Components

### 1. **BadgeContext** (`lib/contexts/BadgeContext.tsx`)
Global context for managing user badges, progress tracking, and badge notifications.

**Features:**
- Fetches user badges and progress
- Checks for new badge achievements after actions
- Automatically shows notifications when badges are earned
- Prevents redundant API calls with built-in caching

**Usage:**
```typescript
import { useBadges } from '@/lib/contexts/BadgeContext';

function MyComponent() {
  const { 
    userBadges, 
    badgeProgress, 
    checkForNewBadges,
    hasCompletedBadge 
  } = useBadges();

  // Check for new badges after an action
  const handleGroupCreation = async () => {
    // ... create group logic ...
    await checkForNewBadges('group_created');
  };
}
```

### 2. **Badge Definitions** (`lib/config/badgeDefinitions.ts`)
Centralized, scalable badge configuration system.

**To add a new badge:**
1. Add the badge type to the `BadgeType` union
2. Add the badge definition to `BADGE_DEFINITIONS`
3. The badge will automatically appear in progress tracking

```typescript
export const BADGE_DEFINITIONS: Record<BadgeType, BadgeDefinition> = {
  // ... existing badges ...
  new_badge_type: {
    badgeType: 'new_badge_type',
    name: 'Badge Name',
    description: 'Badge description',
    icon: '🎯', // Emoji or icon
    requirements: 'How to earn this badge',
    requiresProgress: false,
    tier: 'gold',
    rarity: 'rare'
  }
};
```

### 3. **UI Components**

#### **BadgeProgressDisplay** (`components/profile/BadgeProgressDisplay.tsx`)
Shows all badges with detailed progress tracking, including locked badges.

**Features:**
- Progress bars for incomplete badges
- Toggle between earned and all badges
- Overall completion percentage
- Lock indicators for unearned badges

**Usage:**
```typescript
import { BadgeProgressDisplay } from '@/components/profile/BadgeProgressDisplay';

<BadgeProgressDisplay showProgress={true} />
```

#### **UsernameWithBadge** (`components/profile/UsernameWithBadge.tsx`)
Reusable component combining username with primary badge display.

**Usage:**
```typescript
import { UsernameWithBadge } from '@/components/profile/UsernameWithBadge';

<UsernameWithBadge
  username={user.username}
  profileId={user.id}
  badgeSize="sm"
  showBadgeName={false}
  clickableBadge={true}
/>
```

### 4. **Backend Integration**

#### Existing Endpoints:
- `POST /badges/check` - Check and award badges after actions
- `GET /badges/user/:profileId/progress` - Get badge progress
- `GET /badges/user/:profileId` - Get earned badges

#### Badge Actions:
- `group_created` - When a user creates a group
- `meal_created` - When a user creates a meal
- `voting_participated` - When a user votes
- `voting_won` - When a user's meal wins a vote

## Integration Examples

### Example 1: Group Creation
```typescript
'use client';

import { useBadges } from '@/lib/contexts/BadgeContext';
import { useNotification } from '@/lib/hooks/useNotification';

function CreateGroupForm() {
  const { checkForNewBadges } = useBadges();
  const { showSuccess, showError } = useNotification();

  const handleCreateGroup = async (groupData) => {
    try {
      // Create the group
      const response = await fetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify(groupData)
      });
      
      const newGroup = await response.json();
      
      showSuccess('Group Created!', `Successfully created ${newGroup.name}`);
      
      // Check for badge achievements (this will auto-notify)
      await checkForNewBadges('group_created', { groupId: newGroup.id });
      
    } catch (error) {
      showError('Error', 'Failed to create group');
    }
  };

  return <form onSubmit={handleCreateGroup}>...</form>;
}
```

### Example 2: Meal Creation
```typescript
'use client';

import { useBadges } from '@/lib/contexts/BadgeContext';

function CreateMealForm() {
  const { checkForNewBadges } = useBadges();

  const handleMealSubmit = async (mealData) => {
    // Create meal logic...
    const newMeal = await createMeal(mealData);
    
    // Check for badges - notification happens automatically
    await checkForNewBadges('meal_created', { mealId: newMeal.id });
  };

  return <form onSubmit={handleMealSubmit}>...</form>;
}
```

### Example 3: Voting Action
```typescript
'use client';

import { useBadges } from '@/lib/contexts/BadgeContext';

function VotingButton({ proposalId, sessionId }) {
  const { checkForNewBadges } = useBadges();

  const handleVote = async () => {
    // Cast vote logic...
    await castVote(proposalId);
    
    // Check for voting participation badge
    await checkForNewBadges('voting_participated', { 
      sessionId, 
      proposalId 
    });
  };

  return <button onClick={handleVote}>Vote</button>;
}
```

### Example 4: Voting Winner (Backend)
In the voting completion logic, check if the winner should get a badge:

```javascript
// In votingLib.js or similar
const completeVotingSession = async (sessionId) => {
  // ... voting completion logic ...
  
  const winner = findWinner(proposals);
  
  if (winner && winner.meal.profileId) {
    // Award voting winner badge
    const BadgesLibrary = require('./badgesLib');
    await BadgesLibrary.checkAndAwardBadges(
      winner.meal.profileId, 
      'voting_won',
      { sessionId, mealId: winner.mealId }
    );
  }
};
```

## Replacing Username + Badge with UsernameWithBadge

### Before:
```typescript
<div>
  <span>{username}</span>
  <PrimaryBadgeDisplay profileId={profileId} size="sm" />
</div>
```

### After:
```typescript
<UsernameWithBadge
  username={username}
  profileId={profileId}
  badgeSize="sm"
/>
```

## Files to Update for Badge Checking

1. **Group Creation:**
   - `components/groups/CreateGroupForm.tsx` (or similar)
   - Add `checkForNewBadges('group_created')` after successful creation

2. **Meal Creation:**
   - `components/meals/CreateMealForm.tsx` (or similar)
   - Add `checkForNewBadges('meal_created')` after successful creation

3. **Voting:**
   - `components/voting/VotingCard.tsx` or vote handler
   - Add `checkForNewBadges('voting_participated')` after vote cast

4. **Profile Settings:**
   - Replace `UserBadges` with `BadgeProgressDisplay` for better progress tracking

## Badge Notification Flow

1. User performs an action (creates group, votes, etc.)
2. Frontend calls `checkForNewBadges(action, data)`
3. Backend checks badge conditions via `/badges/check`
4. If badge earned, backend returns newly earned badges
5. Frontend automatically shows success notification with trophy icon
6. Badge data refreshes automatically
7. User sees updated badges in profile

## Testing Badge System

### Test Retroactive Badges:
```bash
curl -X POST http://localhost:4000/badges/award-retroactive/:profileId
```

### Manual Badge Award (for testing):
```bash
curl -X POST http://localhost:4000/badges/award \\
  -H "Content-Type: application/json" \\
  -d '{"profileId": "user-uuid", "badgeId": 1}'
```

### Check Badge Progress:
```bash
curl http://localhost:4000/badges/user/:profileId/progress
```

## Best Practices

1. **Always use BadgeContext** - Don't make direct API calls for badges
2. **Call checkForNewBadges after actions** - Let the system handle notifications
3. **Use UsernameWithBadge consistently** - Provides uniform user display
4. **Show progress in profile** - Use BadgeProgressDisplay instead of simple list
5. **Add new badges in config** - Update `badgeDefinitions.ts` to add new badges

## Scalability

Adding a new badge requires:
1. Add backend badge type to database (if not exists)
2. Add to `badgeDefinitions.ts` (frontend)
3. Add action handler in `badgesLib.js` (backend)
4. Call `checkForNewBadges()` where appropriate

No changes needed to UI components - they automatically adapt!
