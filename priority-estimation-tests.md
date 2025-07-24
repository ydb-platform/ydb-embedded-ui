# Priority Estimation Testing Guide

This document contains comprehensive test cases to validate the priority score estimation logic based on reach/impact/effort methodology.

## Methodology Overview

The priority score is calculated using the formula:

```
Priority Score = (Reach × Impact) / Effort
```

### Label Mappings

**Reach Labels** (how many users/stakeholders are affected):

- `reach:high` → 100
- `reach:medium` → 75
- `reach:low` → 50

**Impact Labels** (how much value/benefit):

- `impact:high` → 200
- `impact:medium` → 137.5
- `impact:low` → 75

**Effort Labels** (how much work required):

- `effort:high` → 10
- `effort:medium` → 5
- `effort:low` → 2

## Test Cases

### Test Case 1: Low Reach, Medium Impact, Medium Effort

1. Create an issue or use existing issue
2. Add labels: `reach:low`, `impact:medium`, `effort:medium`
3. Run the GitHub action (or trigger it by editing the issue)
4. **Expected Priority Score**: (50 × 137.5) / 5 = **1,375**
5. Verify the score appears in the YDB UI project board under "CalculatedPriority" field

### Test Case 2: High Reach, High Impact, Low Effort (Highest Priority)

1. Create an issue or use existing issue
2. Add labels: `reach:high`, `impact:high`, `effort:low`
3. Run the GitHub action
4. **Expected Priority Score**: (100 × 200) / 2 = **10,000**
5. Verify this is one of the highest priority scores

### Test Case 3: Low Reach, Low Impact, High Effort (Lowest Priority)

1. Create an issue or use existing issue
2. Add labels: `reach:low`, `impact:low`, `effort:high`
3. Run the GitHub action
4. **Expected Priority Score**: (50 × 75) / 10 = **375**
5. Verify this is one of the lower priority scores

### Test Case 4: Medium Reach, High Impact, Medium Effort

1. Create an issue or use existing issue
2. Add labels: `reach:medium`, `impact:high`, `effort:medium`
3. Run the GitHub action
4. **Expected Priority Score**: (75 × 200) / 5 = **3,000**
5. Verify this appears as a high-priority item

### Test Case 5: High Reach, Low Impact, High Effort

1. Create an issue or use existing issue
2. Add labels: `reach:high`, `impact:low`, `effort:high`
3. Run the GitHub action
4. **Expected Priority Score**: (100 × 75) / 10 = **750**
5. Verify this gets moderate priority despite high reach

### Test Case 6: Missing Reach Label (Default Values)

1. Create an issue or use existing issue
2. Add labels: `impact:medium`, `effort:medium` (no reach label)
3. Run the GitHub action
4. **Expected Priority Score**: (50 × 137.5) / 5 = **1,375** (uses default reach:low value)
5. Verify the action logs show "reach=default"

### Test Case 7: Missing Impact Label (Default Values)

1. Create an issue or use existing issue
2. Add labels: `reach:high`, `effort:low` (no impact label)
3. Run the GitHub action
4. **Expected Priority Score**: (100 × 75) / 2 = **3,750** (uses default impact:low value)
5. Verify the action logs show "impact=default"

### Test Case 8: Missing Effort Label (Default Values)

1. Create an issue or use existing issue
2. Add labels: `reach:medium`, `impact:high` (no effort label)
3. Run the GitHub action
4. **Expected Priority Score**: (75 × 200) / 5 = **3,000** (uses default effort:medium value)
5. Verify the action logs show "effort=default"

### Test Case 9: All Labels Missing (All Default Values)

1. Create an issue or use existing issue
2. Add no reach/impact/effort labels (or only unrelated labels)
3. Run the GitHub action
4. **Expected Priority Score**: (50 × 75) / 5 = **750** (uses all default values)
5. Verify the action logs show "reach=default, impact=default, effort=default"

### Test Case 10: Label Updates Change Priority

1. Create an issue with labels: `reach:low`, `impact:low`, `effort:high`
2. Run the GitHub action
3. Verify initial score: (50 × 75) / 10 = **375**
4. Update labels to: `reach:high`, `impact:high`, `effort:low`
5. Run the GitHub action again (by editing the issue)
6. **Expected New Priority Score**: (100 × 200) / 2 = **10,000**
7. Verify the score updated correctly in the project board

### Test Case 11: Medium Values Across All Dimensions

1. Create an issue or use existing issue
2. Add labels: `reach:medium`, `impact:medium`, `effort:medium`
3. Run the GitHub action
4. **Expected Priority Score**: (75 × 137.5) / 5 = **2,063** (rounded)
5. Verify this appears as a moderate priority item

### Test Case 12: Multiple Labels of Same Type (Last One Wins)

1. Create an issue or use existing issue
2. Add labels: `reach:low`, `reach:high`, `impact:medium`, `effort:low`
3. Run the GitHub action
4. **Expected Priority Score**: (100 × 137.5) / 2 = **6,875** (uses reach:high as the last processed)
5. Verify the calculation uses the higher reach value

## Validation Steps

For each test case:

1. **Trigger the Action**: Edit the issue description or labels to trigger the workflow
2. **Check Action Logs**: Go to Actions tab → Select the "Update Calculated Priority" run → Check logs for calculation details
3. **Verify Project Board**: Navigate to the YDB UI project board and confirm the "CalculatedPriority" field shows the expected value
4. **Compare Relative Priorities**: Ensure issues with higher calculated scores appear higher in priority rankings

## Expected Log Format

The action should log calculation details in this format:

```
📊 Priority calculation: reach=50, impact=137.5, effort=5 → score=1375
✅ Updated CalculatedPriority of issue #123 to 1375
```

## Troubleshooting

- If the action doesn't trigger, check that the `YDBOT_TOKEN` secret has proper permissions
- If scores don't appear on the project board, verify the issue is added to project #24
- If calculations seem incorrect, check the action logs for the exact values used
- If default values aren't applied correctly, verify the fallback logic in the script

## Boundary Testing

Additional edge cases to consider:

- Very old issues (does age factor still apply?)
- Issues with special characters in labels
- Issues not added to the project board
- Network failures during GraphQL API calls
- Issues with multiple reach/impact/effort labels
