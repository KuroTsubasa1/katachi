import { db } from '../../db'
import { boards, cards, connections, shapes } from '../../db/schema'
import { eq, and, isNull } from 'drizzle-orm'

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
    ),
    with: {
      cards: {
        where: isNull(cards.deletedAt)
      },
      connections: {
        where: isNull(connections.deletedAt)
      },
      shapes: {
        where: isNull(shapes.deletedAt)
      }
    }
  })

  // Transform to client format
  const transformedBoards = userBoards.map(board => ({
    id: board.id,
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
