# Badge System - Quick Reference Card

## 🚀 Quick Start

### Import the Hook
```typescript
import { useBadges } from '@/lib/contexts/BadgeContext';
```

### Check for Badges After Action
```typescript
const { checkForNewBadges } = useBadges();

// After any achievement-worthy action:
await checkForNewBadges('action_type', { optional_data });
```

## 📋 Available Actions

| Action | When to Use | Example Data |
|--------|-------------|--------------|
| `group_created` | After creating a group | `{ groupId: number }` |
| `meal_created` | After creating a meal | `{ mealId: number }` |
| `voting_participated` | After casting a vote | `{ sessionId: number, proposalId: number }` |
| `voting_won` | When user's meal wins (backend) | `{ sessionId: number, mealId: number }` |

## 🎨 Components

### Display Username with Badge
```typescript
import { UsernameWithBadge } from '@/components/profile/UsernameWithBadge';

<UsernameWithBadge
  username="john_doe"
  profileId="user-uuid"
  badgeSize="sm" // or "md", "lg"
/>
```

### Show Badge Progress
```typescript
import { BadgeProgressDisplay } from '@/components/profile/BadgeProgressDisplay';

<BadgeProgressDisplay showProgress={true} />
```

## ➕ Adding New Badges

### 1. Add to Configuration (`lib/config/badgeDefinitions.ts`)
```typescript
export type BadgeType = 
  | 'existing_types'
  | 'new_badge_type'; // Add here

export const BADGE_DEFINITIONS: Record<BadgeType, BadgeDefinition> = {
  new_badge_type: {
    badgeType: 'new_badge_type',
    name: 'Badge Name',
    description: 'What this badge means',
    icon: '🎯', // Use emoji
    requirements: 'How to earn it',
    requiresProgress: false,
    tier: 'gold',
    rarity: 'rare'
  }
};
```

### 2. Add Backend Handler (`controllers/badgesLib.js`)
```javascript
case 'new_action':
  const badge = await prisma.badge.findFirst({
    where: { badgeType: 'new_badge_type', isActive: true }
  });
  if (badge) {
    const result = await this.awardBadge(profileId, badge.BadgeID);
    results.push(result);
  }
  break;
```

### 3. Call in Frontend
```typescript
await checkForNewBadges('new_action', { data });
```

## 🔍 Hook Methods

### Get Badge Data
```typescript
const {
  userBadges,        // Array of earned badges
  badgeProgress,     // Progress for all badges
  loading,           // Loading state
  error,             // Error state
  checkForNewBadges, // Check and notify
  getBadgeByType,    // Get specific badge
  hasCompletedBadge, // Check if earned
  getBadgeProgress   // Get progress for badge
} = useBadges();
```

### Example Usage
```typescript
// Check if user has a badge
if (hasCompletedBadge('group_creation')) {
  console.log('User has created a group!');
}

// Get specific badge
const badge = getBadgeByType('meal_creation');

// Get progress
const progress = getBadgeProgress('voting_participation');
console.log(`Progress: ${progress.progress}/${progress.maxProgress}`);
```

## 📂 Files to Modify for Integration

### Group Creation
- `components/groups/CreateGroupForm.tsx`
- Add: `await checkForNewBadges('group_created')`

### Meal Creation
- `components/meals/meal-form.tsx`
- Add: `await checkForNewBadges('meal_created')`

### Voting
- `components/voting/VotingSessionCard.tsx`
- Add: `await checkForNewBadges('voting_participated')`

## 💡 Pro Tips

1. **Always call after successful action** - Don't call before action completes
2. **Don't block UI** - Call is async but non-blocking
3. **Notification is automatic** - No need to manually show notification
4. **Data is optional** - Pass extra context if helpful
5. **Badge check is idempotent** - Safe to call multiple times

## 🐛 Debugging

### Check Badge Data
```typescript
const { userBadges, badgeProgress } = useBadges();
console.log('Earned:', userBadges);
console.log('Progress:', badgeProgress);
```

### Test Badge Award
```bash
# Award badge manually (backend)
curl -X POST http://localhost:4000/badges/award \
  -H "Content-Type: application/json" \
  -d '{"profileId": "uuid", "badgeId": 1}'
```

### Check Retroactive Badges
```bash
curl -X POST http://localhost:4000/badges/award-retroactive/:profileId
```

## 📖 Full Documentation
- `BADGE_SYSTEM_GUIDE.md` - Complete system documentation
- `BADGE_INTEGRATION_EXAMPLES.tsx` - Code examples
- `BADGE_IMPLEMENTATION_SUMMARY.md` - Implementation details

## ⚡ Common Patterns

### Pattern 1: Simple Action with Badge
```typescript
const handleAction = async () => {
  try {
    await performAction();
    await checkForNewBadges('action_type');
  } catch (error) {
    console.error(error);
  }
};
```

### Pattern 2: Action with Extra Data
```typescript
const handleAction = async (itemId: number) => {
  const result = await performAction();
  await checkForNewBadges('action_type', { 
    itemId,
    timestamp: new Date()
  });
};
```

### Pattern 3: Multiple Actions
```typescript
const handleComplexAction = async () => {
  await action1();
  await checkForNewBadges('action_1');
  
  await action2();
  await checkForNewBadges('action_2');
};
```

---

**Remember:** The badge system handles notifications automatically. Just call `checkForNewBadges()` after actions and the rest is taken care of!
