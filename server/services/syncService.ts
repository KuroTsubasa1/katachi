import { db } from '../db'
import { boards, cards, connections, shapes, cardHistory, boardHistory, boardShares } from '../db/schema'
import { eq, and, isNull, or } from 'drizzle-orm'
import { getUserBoardPermission } from './sharingService'

interface SyncOperation {
  type: 'board' | 'card' | 'connection' | 'shape'
  operation: 'create' | 'update' | 'delete'
  id: string
  data?: any
  version?: number
}

export async function processBatchSync(userId: string, operations: SyncOperation[]) {
  const results = {
    synced: [] as string[],
    conflicts: [] as any[],
    errors: [] as any[]
  }

  for (const op of operations) {
    try {
      await processSingleOperation(userId, op, results)
    } catch (error: any) {
      results.errors.push({
        id: op.id,
        type: op.type,
        message: error.message
      })
    }
  }

  return results
}

async function processSingleOperation(
  userId: string,
  op: SyncOperation,
  results: any
) {
  switch (op.type) {
    case 'board':
      await syncBoard(userId, op, results)
      break
    case 'card':
      await syncCard(userId, op, results)
      break
    case 'connection':
      await syncConnection(userId, op, results)
      break
    case 'shape':
      await syncShape(userId, op, results)
      break
  }
}

async function syncBoard(userId: string, op: SyncOperation, results: any) {
  if (op.operation === 'create') {
    // Check if board already exists
    const existing = await db.query.boards.findFirst({
      where: eq(boards.id, op.id)
    })

    if (existing) {
      results.conflicts.push({ id: op.id, type: 'board', reason: 'already_exists' })
      return
    }

    await db.insert(boards).values({
      id: op.id,
      userId,
      name: op.data.name,
      backgroundColor: op.data.backgroundColor,
      createdAt: new Date(op.data.createdAt),
      updatedAt: new Date(op.data.updatedAt),
      version: 1
    })

    // Save to history
    await saveBoardHistory(op.id, userId, 1, op.data, 'create')

    results.synced.push(op.id)
  } else if (op.operation === 'update') {
    const existing = await db.query.boards.findFirst({
      where: and(eq(boards.id, op.id), eq(boards.userId, userId))
    })

    if (!existing) {
      results.errors.push({ id: op.id, message: 'Board not found' })
      return
    }

    // Conflict detection
    if (existing.version !== op.version) {
      results.conflicts.push({
        id: op.id,
        type: 'board',
        serverVersion: existing.version,
        clientVersion: op.version
      })
      return
    }

    // Update with version increment
    await db.update(boards)
      .set({
        name: op.data.name,
        backgroundColor: op.data.backgroundColor,
        updatedAt: new Date(),
        version: existing.version + 1
      })
      .where(eq(boards.id, op.id))

    await saveBoardHistory(op.id, userId, existing.version + 1, op.data, 'update')

    results.synced.push(op.id)
  }
}

async function syncCard(userId: string, op: SyncOperation, results: any) {
  // Verify user has permission to modify this board
  const boardId = op.data.boardId || op.data.board_id

  if (!boardId) {
    console.error('[Sync] Card operation missing boardId:', op)
    results.errors.push({
      id: op.id,
      message: 'Card operation missing boardId'
    })
    return
  }

  const permission = await getUserBoardPermission(userId, boardId)

  if (!permission || permission === 'view') {
    console.error('[Sync] Permission denied for user', userId, 'on board', boardId, '- permission:', permission)
    results.errors.push({
      id: op.id,
      message: `Insufficient permissions to modify board (${permission || 'none'})`
    })
    return
  }

  if (op.operation === 'create') {
    await db.insert(cards).values({
      id: op.id,
      boardId: op.data.boardId || op.data.board_id,
      type: op.data.type,
      positionX: Math.round(op.data.position?.x || 0),
      positionY: Math.round(op.data.position?.y || 0),
      width: Math.round(op.data.size?.width || 200),
      height: Math.round(op.data.size?.height || 150),
      content: op.data.content,
      htmlContent: op.data.htmlContent,
      imageUrl: op.data.imageUrl,
      url: op.data.url,
      audioUrl: op.data.audioUrl,
      videoUrl: op.data.videoUrl,
      mapLocation: op.data.mapLocation,
      markdown: op.data.markdown,
      color: op.data.color,
      zIndex: op.data.zIndex,
      drawingData: op.data.drawingData,
      columnCards: op.data.columnCards,
      tableData: op.data.tableData,
      todoData: op.data.todoData,
      createdAt: new Date(op.data.createdAt),
      updatedAt: new Date(op.data.updatedAt),
      version: 1
    })

    await saveCardHistory(op.id, op.data.boardId, userId, 1, op.data, 'create')

    results.synced.push(op.id)
  } else if (op.operation === 'update') {
    const existing = await db.query.cards.findFirst({
      where: eq(cards.id, op.id)
    })

    if (!existing) {
      // Card doesn't exist - create it instead of updating
      console.log(`[Sync] Card ${op.id} not found, creating instead of updating`)
      await db.insert(cards).values({
        id: op.id,
        boardId: op.data.boardId || op.data.board_id,
        type: op.data.type,
        positionX: Math.round(op.data.position?.x || 0),
        positionY: Math.round(op.data.position?.y || 0),
        width: Math.round(op.data.size?.width || 200),
        height: Math.round(op.data.size?.height || 150),
        content: op.data.content,
        htmlContent: op.data.htmlContent,
        imageUrl: op.data.imageUrl,
        url: op.data.url,
        audioUrl: op.data.audioUrl,
        videoUrl: op.data.videoUrl,
        mapLocation: op.data.mapLocation,
        markdown: op.data.markdown,
        color: op.data.color,
        zIndex: op.data.zIndex,
        drawingData: op.data.drawingData,
        columnCards: op.data.columnCards,
        tableData: op.data.tableData,
        todoData: op.data.todoData,
        createdAt: new Date(op.data.createdAt),
        updatedAt: new Date(op.data.updatedAt),
        version: 1
      })

      await saveCardHistory(op.id, op.data.boardId || op.data.board_id, userId, 1, op.data, 'create')
      results.synced.push(op.id)
      return
    }

    console.log(`[Sync] Updating card ${op.id}:`, {
      type: op.data.type,
      content: op.data.content?.substring(0, 50),
      url: op.data.url,
      imageUrl: op.data.imageUrl
    })

    await db.update(cards)
      .set({
        positionX: Math.round(op.data.position?.x),
        positionY: Math.round(op.data.position?.y),
        width: Math.round(op.data.size?.width),
        height: Math.round(op.data.size?.height),
        content: op.data.content,
        htmlContent: op.data.htmlContent,
        imageUrl: op.data.imageUrl,
        url: op.data.url,
        audioUrl: op.data.audioUrl,
        videoUrl: op.data.videoUrl,
        mapLocation: op.data.mapLocation,
        markdown: op.data.markdown,
        color: op.data.color,
        zIndex: op.data.zIndex,
        drawingData: op.data.drawingData,
        columnCards: op.data.columnCards,
        tableData: op.data.tableData,
        todoData: op.data.todoData,
        updatedAt: new Date(),
        version: existing.version + 1
      })
      .where(eq(cards.id, op.id))

    // Also update the board's updatedAt timestamp
    await db.update(boards)
      .set({ updatedAt: new Date() })
      .where(eq(boards.id, existing.boardId))

    await saveCardHistory(op.id, existing.boardId, userId, existing.version + 1, op.data, 'update')

    results.synced.push(op.id)
  } else if (op.operation === 'delete') {
    await db.update(cards)
      .set({ deletedAt: new Date() })
      .where(eq(cards.id, op.id))

    results.synced.push(op.id)
  }
}

async function syncConnection(userId: string, op: SyncOperation, results: any) {
  // Verify user has permission to modify this board
  const permission = await getUserBoardPermission(userId, op.data.boardId)

  if (!permission || permission === 'view') {
    results.errors.push({
      id: op.id,
      message: 'Insufficient permissions to modify board'
    })
    return
  }

  if (op.operation === 'create') {
    await db.insert(connections).values({
      id: op.id,
      boardId: op.data.boardId,
      fromCardId: op.data.fromCardId,
      toCardId: op.data.toCardId,
      color: op.data.color,
      width: op.data.width,
      style: op.data.style,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    results.synced.push(op.id)
  }
}

async function syncShape(userId: string, op: SyncOperation, results: any) {
  // Verify user has permission to modify this board
  const permission = await getUserBoardPermission(userId, op.data.boardId)

  if (!permission || permission === 'view') {
    results.errors.push({
      id: op.id,
      message: 'Insufficient permissions to modify board'
    })
    return
  }

  if (op.operation === 'create') {
    await db.insert(shapes).values({
      id: op.id,
      boardId: op.data.boardId,
      type: op.data.type,
      positionX: Math.round(op.data.position.x),
      positionY: Math.round(op.data.position.y),
      width: Math.round(op.data.size.width),
      height: Math.round(op.data.size.height),
      color: op.data.color,
      strokeWidth: op.data.width,
      fill: op.data.fill || false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    results.synced.push(op.id)
  }
}

async function saveBoardHistory(boardId: string, userId: string, version: number, snapshot: any, operation: string) {
  await db.insert(boardHistory).values({
    boardId,
    userId,
    version,
    snapshot,
    operation
  })
}

async function saveCardHistory(cardId: string, boardId: string, userId: string, version: number, snapshot: any, operation: string) {
  await db.insert(cardHistory).values({
    cardId,
    boardId,
    userId,
    version,
    snapshot,
    operation
  })
}

export async function getBoardHistory(boardId: string, limit: number = 50) {
  return await db.query.boardHistory.findMany({
    where: eq(boardHistory.boardId, boardId),
    orderBy: (boardHistory, { desc }) => [desc(boardHistory.createdAt)],
    limit
  })
}

export async function getCardHistory(cardId: string, limit: number = 50) {
  return await db.query.cardHistory.findMany({
    where: eq(cardHistory.cardId, cardId),
    orderBy: (cardHistory, { desc }) => [desc(cardHistory.createdAt)],
    limit
  })
}
