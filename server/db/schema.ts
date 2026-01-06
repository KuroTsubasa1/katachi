import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  emailVerified: boolean('email_verified').default(true),
  loginCode: varchar('login_code', { length: 10 }),
  loginCodeExpiry: timestamp('login_code_expiry'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at')
})

export const boards = pgTable('boards', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  backgroundColor: varchar('background_color', { length: 50 }).default('#f5f5f5'),
  version: integer('version').default(1).notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  syncedAt: timestamp('synced_at')
})

export const cards = pgTable('cards', {
  id: uuid('id').primaryKey(),
  boardId: uuid('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  positionX: integer('position_x').notNull(),
  positionY: integer('position_y').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  content: text('content'),
  htmlContent: text('html_content'),
  imageUrl: text('image_url'),
  url: text('url'),
  audioUrl: text('audio_url'),
  videoUrl: text('video_url'),
  mapLocation: text('map_location'),
  markdown: text('markdown'),
  color: varchar('color', { length: 50 }),
  zIndex: integer('z_index').notNull(),
  drawingData: jsonb('drawing_data'),
  columnCards: jsonb('column_cards'),
  tableData: jsonb('table_data'),
  todoData: jsonb('todo_data'),
  version: integer('version').default(1).notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  syncedAt: timestamp('synced_at')
})

export const connections = pgTable('connections', {
  id: uuid('id').primaryKey(),
  boardId: uuid('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  fromCardId: uuid('from_card_id').notNull(),
  toCardId: uuid('to_card_id').notNull(),
  color: varchar('color', { length: 50 }).notNull(),
  width: integer('width').notNull(),
  style: varchar('style', { length: 20 }).notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

export const shapes = pgTable('shapes', {
  id: uuid('id').primaryKey(),
  boardId: uuid('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  positionX: integer('position_x').notNull(),
  positionY: integer('position_y').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  color: varchar('color', { length: 50 }).notNull(),
  strokeWidth: integer('stroke_width').notNull(),
  fill: boolean('fill').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

// Board sharing and permissions
export const boardShares = pgTable('board_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  boardId: uuid('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permission: varchar('permission', { length: 20 }).notNull(), // 'view', 'edit', 'admin'
  invitedBy: uuid('invited_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Real-time presence tracking
export const presence = pgTable('presence', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  boardId: uuid('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  cursorX: integer('cursor_x'),
  cursorY: integer('cursor_y'),
  color: varchar('color', { length: 50 }), // User cursor color
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull()
})

// Version history for undo/redo
export const cardHistory = pgTable('card_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  cardId: uuid('card_id').notNull(),
  boardId: uuid('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  version: integer('version').notNull(),
  snapshot: jsonb('snapshot').notNull(), // Full card state
  operation: varchar('operation', { length: 20 }).notNull(), // 'create', 'update', 'delete'
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const boardHistory = pgTable('board_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  boardId: uuid('board_id').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  version: integer('version').notNull(),
  snapshot: jsonb('snapshot').notNull(), // Full board state
  operation: varchar('operation', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})
