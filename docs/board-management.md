# Board Management

This document describes the board management features in the application, including creation, renaming, and synchronization.

## Overview

Boards are the primary organizational unit in the application. Each board can contain multiple note cards, connections, and shapes. Users can create multiple boards and switch between them.

## Features

### Board Creation

Users can create new boards by clicking the "+" button in the sidebar. New boards are automatically assigned a sequential name like "Board 1", "Board 2", etc.

### Board Renaming

Board renaming allows users to give their boards meaningful names. The feature was redesigned to use a custom dialog instead of the browser's native prompt.

#### User Experience

1. User clicks the rename button (pencil icon) next to the currently selected board in the sidebar
2. A modal dialog appears with the current board name pre-filled
3. User edits the name in the text input
4. User clicks "Rename" or presses Enter to confirm, or "Cancel"/"Esc" to abort

#### Technical Implementation

The rename feature consists of three main components:

1. **RenameBoardDialog Component** (`/components/RenameBoardDialog.vue`)
   - Custom Vue component with Tailwind CSS styling
   - Supports dark mode
   - Auto-focuses and selects text when opened
   - Real-time validation with character count (max 255 chars)
   - Error handling and display

2. **Index Page Integration** (`/pages/index.vue`)
   - Manages dialog visibility state
   - Tracks which board is being renamed
   - Handles user interactions

3. **Canvas Store Action** (`/stores/canvas.ts`)
   - `renameBoard(boardId, newName)` action
   - Updates board name and timestamp
   - Persists to localStorage
   - Queues sync to server

#### Architecture Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Index Page
    participant Dialog as RenameBoardDialog
    participant Store as Canvas Store
    participant Sync as Sync Service
    participant Server

    User->>UI: Click rename button
    UI->>Dialog: Open dialog with board data
    Dialog->>User: Show input with current name
    User->>Dialog: Edit name and submit
    Dialog->>UI: Emit rename event(boardId, newName)
    UI->>Store: Call renameBoard()
    Store->>Store: Update board name & timestamp
    Store->>Store: Save to localStorage
    Store->>Sync: Queue update sync
    Sync->>Server: POST /api/boards/update
    Server-->>Sync: Confirmation
    Dialog->>User: Close dialog
```

#### Data Flow

```mermaid
graph LR
    A[User Input] --> B[RenameBoardDialog]
    B --> C{Validation}
    C -->|Valid| D[Emit rename event]
    C -->|Invalid| E[Show error]
    D --> F[handleRenameBoard]
    F --> G[canvasStore.renameBoard]
    G --> H[Update State]
    G --> I[Save localStorage]
    G --> J[Queue Sync]
    J --> K[Server Update]
```

### Validation Rules

The rename feature enforces the following validation rules:

- **Required**: Board name cannot be empty
- **Maximum Length**: 255 characters (matches database schema)
- **Trimming**: Leading and trailing whitespace is automatically removed
- **Change Detection**: Cannot save if name hasn't changed
- **No Duplicates**: Currently not enforced (future enhancement)

### Synchronization

When a board is renamed:

1. The change is immediately applied locally (optimistic update)
2. The board's `updatedAt` timestamp is updated
3. Changes are saved to localStorage for offline persistence
4. A sync operation is queued to update the server
5. The sync service handles retries and conflict resolution

The sync payload includes:
```typescript
{
  id: string,        // Board UUID
  name: string,      // New board name
  updatedAt: string  // ISO timestamp
}
```

### Error Handling

The dialog handles various error scenarios:

- **Empty name**: "Board name cannot be empty"
- **Too long**: "Board name is too long (max 255 characters)"
- **Network errors**: Displayed in red alert box
- **Board not found**: Logged to console

### Keyboard Shortcuts

- **Enter**: Submit rename (same as clicking "Rename" button)
- **Escape**: Cancel and close dialog

### Visual Design

The dialog follows the application's design system:

- Consistent with other dialogs (ShareBoardDialog, VersionHistoryDialog)
- Semi-transparent backdrop (black 50% opacity)
- White card with shadow (dark mode: gray-800)
- Blue primary button for confirmation
- Gray secondary button for cancellation
- Smooth transitions and hover effects
- Responsive and accessible

## Board Sharing

Boards can be shared with other users with different permission levels.

### Sharing a Board

1. Select the board you want to share
2. Click the share button (🔗) in the sidebar
3. Enter the recipient's email address
4. Select permission level:
   - **View**: Can see board content only
   - **Edit**: Can modify cards, connections, shapes
   - **Admin**: Can share board with others
5. Click "Share Board"

### How Shared Boards Appear

When a board is shared:
- It appears in the recipient's board list automatically
- Shared board link format: `http://localhost:3000/?board=BOARD_ID`
- Recipient can click the link to open the board directly
- Board is loaded with all content (cards, connections, shapes)

### Real-Time Updates

The application uses **polling** to keep shared boards synchronized:

- Polls server every 5 seconds for board updates
- Automatically fetches changes from shared boards
- Uses timestamp comparison to keep newest version
- Preserves local changes on owned boards
- Server version takes priority for shared boards

### Technical Implementation

```mermaid
graph TB
    A[User A owns Board] --> B[User A shares with User B]
    B --> C[Board added to board_shares table]
    C --> D[User B's /api/boards includes shared board]

    E[User A makes changes] --> F[Changes sync to server]
    F --> G[Server updates board.updatedAt]

    H[User B polls every 5s] --> I[Fetch /api/boards]
    I --> J{Server updatedAt > Local?}
    J -->|Yes| K[Update User B's local board]
    J -->|No| L[Keep User B's local version]

    K --> M[User B sees changes]
```

### Polling Behavior

**On Authentication**:
- Initial sync fetches all boards (owned + shared)
- Polling starts automatically
- Runs every 5 seconds

**Smart Merging**:
- Owned boards: Local changes take priority (if newer)
- Shared boards: Server changes take priority (if newer)
- Preserves current board selection
- Adds new shared boards automatically

**Cleanup**:
- Polling stops when user logs out
- Polling stops when component unmounts
- Prevents memory leaks

## Future Enhancements

Potential improvements to board management:

1. **WebSocket Real-Time**: Replace polling with WebSocket for instant updates
2. **Duplicate Detection**: Prevent or warn about duplicate board names
3. **Inline Editing**: Allow renaming directly in the sidebar
4. **Undo/Redo**: Integrate with version history system
5. **Bulk Operations**: Rename multiple boards at once
6. **Templates**: Create boards from templates
7. **Favorites**: Mark boards as favorites for quick access
8. **Sorting**: Custom sort order for boards
9. **Archive**: Soft delete boards instead of permanent deletion
10. **Presence Indicators**: Show who's viewing/editing shared boards

## Related Files

- `/components/RenameBoardDialog.vue` - Dialog component
- `/pages/index.vue` - Main page with board list
- `/stores/canvas.ts` - Canvas store with renameBoard action
- `/composables/useSync.ts` - Sync service
- `/server/api/boards/` - Board API endpoints
- `/server/db/schema.ts` - Database schema
- `/types/index.ts` - TypeScript type definitions
