import { db } from '../../db'
import { boards, cards, connections, shapes, boardTemplates } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { templateSeeds } from '../../data/templateSeeds'

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const body = await readBody(event)
  const { templateName, boardName } = body

  // Find template from seeds
  const template = templateSeeds.find(t => t.name === templateName)

  if (!template) {
    throw createError({
      statusCode: 404,
      message: 'Template not found'
    })
  }

  // Create new board
  const boardId = crypto.randomUUID()
  const now = new Date()

  await db.insert(boards).values({
    id: boardId,
    userId: user.id,
    name: boardName || template.name,
    backgroundColor: '#f5f5f5',
    createdAt: now,
    updatedAt: now,
    version: 1
  })

  // Clone cards with new UUIDs
  const templateData = template.templateData as any

  for (const templateCard of templateData.cards || []) {
    const newCardId = crypto.randomUUID()

    await db.insert(cards).values({
      id: newCardId,
      boardId,
      type: templateCard.type,
      positionX: templateCard.position.x,
      positionY: templateCard.position.y,
      width: templateCard.size.width,
      height: templateCard.size.height,
      content: templateCard.content || '',
      htmlContent: templateCard.htmlContent,
      imageUrl: templateCard.imageUrl,
      markdown: templateCard.markdown,
      color: templateCard.color,
      zIndex: templateCard.zIndex || 1,
      columnCards: templateCard.columnCards,
      todoData: templateCard.todoData,
      storyboardData: templateCard.storyboardData,
      createdAt: now,
      updatedAt: now,
      version: 1
    })
  }

  return { boardId, success: true }
})
