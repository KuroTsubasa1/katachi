import { db } from '../../db'
import { boards, cards, connections, shapes, boardShares } from '../../db/schema'
import { eq, and, isNull, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  // Get user's own boards
  const userBoards = await db.query.boards.findMany({
    where: and(
      eq(boards.userId, user.id),
      isNull(boards.deletedAt)
    )
  })

  // Get boards shared with the user
  const sharedBoardRecords = await db.query.boardShares.findMany({
    where: eq(boardShares.userId, user.id)
  })

  // Get the actual board data for shared boards
  const sharedBoardIds = sharedBoardRecords.map(share => share.boardId)
  const sharedBoards = sharedBoardIds.length > 0
    ? await db.query.boards.findMany({
        where: and(
          inArray(boards.id, sharedBoardIds),
          isNull(boards.deletedAt)
        )
      })
    : []

  // Combine owned and shared boards
  const allBoards = [...userBoards, ...sharedBoards]

  // Manually fetch related data for each board
  const boardsWithRelations = await Promise.all(
    allBoards.map(async (board) => {
      const boardCards = await db.query.cards.findMany({
        where: and(
          eq(cards.boardId, board.id),
          isNull(cards.deletedAt)
        )
      })

      const boardConnections = await db.query.connections.findMany({
        where: and(
          eq(connections.boardId, board.id),
          isNull(connections.deletedAt)
        )
      })

      const boardShapes = await db.query.shapes.findMany({
        where: and(
          eq(shapes.boardId, board.id),
          isNull(shapes.deletedAt)
        )
      })

      return {
        ...board,
        cards: boardCards,
        connections: boardConnections,
        shapes: boardShapes
      }
    })
  )

  console.log(`[Boards API] User ${user.email} - Returning ${boardsWithRelations.length} boards`)
  boardsWithRelations.forEach(b => {
    console.log(`  - Board: ${b.name} (${b.id}) - ${b.cards.length} cards, ${b.connections.length} connections, ${b.shapes.length} shapes`)
    b.cards.forEach(c => {
      console.log(`    Card ${c.type}: content="${c.content?.substring(0, 30)}", url="${c.url}", imageUrl="${c.imageUrl?.substring(0, 50)}"`)
    })
  })

  // Transform to client format
  const transformedBoards = boardsWithRelations.map(board => ({
    id: board.id,
    userId: board.userId,
    name: board.name,
    backgroundColor: board.backgroundColor || '#f5f5f5',
    cards: board.cards.map(card => ({
      id: card.id,
      type: card.type,
      position: { x: card.positionX, y: card.positionY },
      size: { width: card.width, height: card.height },
      content: card.content || '',
      htmlContent: card.htmlContent,
      imageUrl: card.imageUrl,
      url: card.url,
      audioUrl: card.audioUrl,
      videoUrl: card.videoUrl,
      mapLocation: card.mapLocation,
      markdown: card.markdown,
      color: card.color,
      zIndex: card.zIndex,
      drawingData: card.drawingData,
      columnCards: card.columnCards,
      tableData: card.tableData,
      todoData: card.todoData,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString()
    })),
    connections: board.connections || [],
    shapes: board.shapes?.map(shape => ({
      id: shape.id,
      type: shape.type,
      position: { x: shape.positionX, y: shape.positionY },
      size: { width: shape.width, height: shape.height },
      color: shape.color,
      width: shape.strokeWidth,
      fill: shape.fill
    })) || [],
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString()
  }))

  return { boards: transformedBoards }
})
