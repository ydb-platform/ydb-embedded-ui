# Threads Tab Implementation Documentation

## Overview

This document describes the implementation of the Threads tab for the Node page in YDB Embedded UI, which displays detailed thread pool information as requested in issue #2051.

## Features Implemented

- **Complete UI Components**: Thread pools table with all required columns
- **CPU Usage Visualization**: Progress bars showing system + user CPU usage with color coding
- **Thread State Visualization**: Horizontal bar chart showing distribution of thread states (R, S, etc.)
- **Real API Integration**: Connected to RTK Query with auto-refresh and error handling
- **TypeScript Types**: Complete type definitions for thread pool information
- **Internationalization**: Full i18n support following project conventions

## Component Structure

```
src/containers/Node/Threads/
├── Threads.tsx                 # Main component
├── Threads.scss               # Styling
├── CpuUsageBar/               # CPU usage visualization
│   ├── CpuUsageBar.tsx
│   └── CpuUsageBar.scss
├── ThreadStatesBar/           # Thread states visualization
│   ├── ThreadStatesBar.tsx
│   └── ThreadStatesBar.scss
└── i18n/                      # Internationalization
    ├── en.json
    └── index.ts
```

## Data Structure

The component expects thread pool information in the following format:

```typescript
interface TThreadPoolInfo {
  Name?: string; // Thread pool name (e.g., "AwsEventLoop", "klktmr.IC")
  Threads?: number; // Number of threads in the pool
  SystemUsage?: number; // System CPU usage (0-1 range)
  UserUsage?: number; // User CPU usage (0-1 range)
  MinorPageFaults?: number; // Number of minor page faults
  MajorPageFaults?: number; // Number of major page faults
  States?: Record<string, number>; // Thread states with counts (e.g., {R: 2, S: 1})
}
```

## Backend Integration Required

Currently, the implementation uses mock data. To connect real data, the YDB backend needs to provide detailed thread information through one of these approaches:

### Option 1: New Dedicated Endpoint (Recommended)

```
GET /viewer/json/threads?node_id={nodeId}
```

Response format:

```json
{
  "Threads": [
    {
      "Name": "AwsEventLoop",
      "Threads": 64,
      "SystemUsage": 0.0,
      "UserUsage": 0.0,
      "MinorPageFaults": 0,
      "MajorPageFaults": 0,
      "States": {
        "S": 64
      }
    }
  ],
  "ResponseTime": "1234567890",
  "ResponseDuration": 123
}
```

### Option 2: Extend Existing Endpoint

Extend `/viewer/json/sysinfo` to include detailed thread information in addition to the current `PoolStats`.

## API Implementation

The frontend API integration is already implemented:

1. **Viewer API**: `getNodeThreads()` method in `src/services/api/viewer.ts`
2. **Node Store**: RTK Query endpoint in `src/store/reducers/node/node.ts`
3. **Component**: Connected with auto-refresh in `src/containers/Node/Threads/Threads.tsx`

## Data Mapping

The backend should provide:

- **Thread Pool Name**: From the actual thread pool name
- **Thread Count**: Number of threads in each pool
- **CPU Usage**: System and user CPU usage percentages (0-1 range)
- **Page Faults**: Minor and major page fault counts
- **Thread States**: Distribution of thread states using Linux process state codes:
  - `R`: Running
  - `S`: Sleeping (interruptible)
  - `D`: Disk sleep (uninterruptible)
  - `Z`: Zombie
  - `T`: Stopped
  - etc.

## Screenshots

The implementation provides a complete table view matching the requirements in the issue:

- Pool name column
- Thread count column
- CPU usage with visual progress bar
- Page fault counts
- Thread state distribution visualization

## Testing

To test the implementation:

1. Navigate to `/node/{nodeId}/threads` in the YDB Embedded UI
2. The tab will be available in the node page tabs
3. Currently shows mock data until backend integration is complete

## Next Steps

1. **Backend Development**: Implement the threads endpoint in YDB backend
2. **Real Data Integration**: Replace mock data with actual thread information
3. **Testing**: Verify with real YDB instances
4. **Performance**: Ensure efficient data collection for thread statistics

## Related Files

- Node page tabs: `src/containers/Node/NodePages.ts`
- Node page component: `src/containers/Node/Node.tsx`
- Thread types: `src/types/api/threads.ts`
- API viewer: `src/services/api/viewer.ts`
- Node store: `src/store/reducers/node/node.ts`
