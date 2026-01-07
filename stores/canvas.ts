import { defineStore } from 'pinia'
import type { NoteCard, Board, ViewPort, Tool, Shape, Connection } from '~/types'
import { useSync } from '~/composables/useSync'

const STORAGE_KEY = 'katachi_boards'
const VIEWPORT_KEY = 'katachi_viewport'
const DRAWING_KEY = 'katachi_drawings'
const SETTINGS_KEY = 'katachi_settings'

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    currentBoard: null as Board | null,
    boards: [] as Board[],
    boardVersion: 0, // Increment this to force re-renders
    viewport: {
      x: 0,
      y: 0,
      scale: 1
    } as ViewPort,
    selectedCardId: null as string | null,
    isDragging: false,
    isPanning: false,
    draggingCardId: null as string | null,
    dropTargetColumnId: null as string | null,
    snapToGrid: false,
    gridSize: 20,
    darkMode: false,
    globalDrawingPaths: [] as string[],
    connectionStart: null as string | null,
    currentTool: {
      type: 'select',
      color: '#000000',
      width: 2
    } as Tool,
    clipboard: null as NoteCard | null
  }),

  getters: {
    selectedCard: (state): NoteCard | null => {
      if (!state.currentBoard || !state.selectedCardId) return null
      return state.currentBoard.cards.find(card => card.id === state.selectedCardId) || null
    },

    sortedCards: (state): NoteCard[] => {
      if (!state.currentBoard) return []
      return [...state.currentBoard.cards].sort((a, b) => a.zIndex - b.zIndex)
    }
  },

  actions: {
    createBoard(name: string): Board {
      const now = new Date().toISOString()
      const board: Board = {
        id: crypto.randomUUID(),
        name,
        cards: [],
        connections: [],
        shapes: [],
        backgroundColor: '#f5f5f5',
        createdAt: now,
        updatedAt: now
      }
      this.boards.push(board)
      this.currentBoard = board

      // Sync to server
      if (typeof window !== 'undefined') {
        const { queueSync } = useSync()
        queueSync('board', 'create', board)
      }

      return board
    },

    renameBoard(boardId: string, newName: string) {
      const board = this.boards.find(b => b.id === boardId)
      if (!board) {
        console.error('Board not found:', boardId)
        return
      }

      const oldName = board.name
      board.name = newName
      board.updatedAt = new Date().toISOString()

      // Save to localStorage
      this.saveToLocalStorage()

      // Sync to server
      if (typeof window !== 'undefined') {
        const { queueSync } = useSync()
        queueSync('board', 'update', {
          id: board.id,
          name: board.name,
          updatedAt: board.updatedAt
        })
      }

      console.log(`Board renamed from "${oldName}" to "${newName}"`)
    },

    deleteBoard(boardId: string) {
      const boardIndex = this.boards.findIndex(b => b.id === boardId)
      if (boardIndex === -1) {
        console.error('Board not found:', boardId)
        return
      }

      const boardName = this.boards[boardIndex].name

      // Remove from local boards array
      this.boards.splice(boardIndex, 1)

      // If deleted board was current, switch to another board
      if (this.currentBoard?.id === boardId) {
        this.currentBoard = this.boards.length > 0 ? this.boards[0] : null
      }

      // Save to localStorage
      this.saveToLocalStorage()

      // Sync deletion to server
      if (typeof window !== 'undefined') {
        const { queueSync } = useSync()
        queueSync('board', 'delete', {
          id: boardId
        })
      }

      console.log(`Board deleted: "${boardName}"`)
    },

    addCard(card: Omit<NoteCard, 'id' | 'createdAt' | 'updatedAt' | 'zIndex'>): NoteCard {
      if (!this.currentBoard) throw new Error('No active board')

      const maxZIndex = this.currentBoard.cards.reduce((max, c) => Math.max(max, c.zIndex), 0)
      const now = new Date().toISOString()
      const newCard: NoteCard = {
        ...card,
        id: crypto.randomUUID(),
        zIndex: maxZIndex + 1,
        createdAt: now,
        updatedAt: now
      }

      this.currentBoard.cards.push(newCard)
      this.currentBoard.updatedAt = now

      // Sync to server
      if (typeof window !== 'undefined') {
        const { queueSync } = useSync()
        queueSync('card', 'create', { ...newCard, boardId: this.currentBoard.id })
      }

      return newCard
    },

    updateCard(cardId: string, updates: Partial<NoteCard>) {
      if (!this.currentBoard) return

      const cardIndex = this.currentBoard.cards.findIndex(c => c.id === cardId)
      if (cardIndex === -1) return

      // Prevent negative coordinates
      if (updates.position) {
        updates.position.x = Math.max(0, updates.position.x)
        updates.position.y = Math.max(0, updates.position.y)
      }

      const now = new Date().toISOString()
      this.currentBoard.cards[cardIndex] = {
        ...this.currentBoard.cards[cardIndex],
        ...updates,
        updatedAt: now
      }
      this.currentBoard.updatedAt = now

      // Sync to server
      if (typeof window !== 'undefined') {
        const { queueSync } = useSync()
        queueSync('card', 'update', { ...this.currentBoard.cards[cardIndex], boardId: this.currentBoard.id })
      }
    },

    deleteCard(cardId: string) {
      if (!this.currentBoard) return

      const cardToDelete = this.currentBoard.cards.find(c => c.id === cardId)
      if (!cardToDelete) return

      this.currentBoard.cards = this.currentBoard.cards.filter(c => c.id !== cardId)
      this.currentBoard.updatedAt = new Date().toISOString()

      if (this.selectedCardId === cardId) {
        this.selectedCardId = null
      }

      // Sync deletion to server
      if (typeof window !== 'undefined') {
        const { queueSync } = useSync()
        queueSync('card', 'delete', { id: cardId, boardId: this.currentBoard.id })
      }
    },

    selectCard(cardId: string | null) {
      this.selectedCardId = cardId

      if (cardId && this.currentBoard) {
        const card = this.currentBoard.cards.find(c => c.id === cardId)
        if (card) {
          this.bringToFront(cardId)
        }
      }
    },

    bringToFront(cardId: string) {
      if (!this.currentBoard) return

      const maxZIndex = this.currentBoard.cards.reduce((max, c) => Math.max(max, c.zIndex), 0)
      this.updateCard(cardId, { zIndex: maxZIndex + 1 })
    },

    updateViewport(updates: Partial<ViewPort>) {
      this.viewport = { ...this.viewport, ...updates }
    },

    setDragging(isDragging: boolean) {
      this.isDragging = isDragging
    },

    setPanning(isPanning: boolean) {
      this.isPanning = isPanning
    },

    setTool(tool: Partial<Tool>) {
      this.currentTool = { ...this.currentTool, ...tool }
    },

    setDraggingCard(cardId: string | null) {
      this.draggingCardId = cardId
    },

    setDropTargetColumn(columnId: string | null) {
      this.dropTargetColumnId = columnId
    },

    copyCard(cardId: string) {
      if (!this.currentBoard) return

      const card = this.currentBoard.cards.find(c => c.id === cardId)
      if (card) {
        this.clipboard = { ...card }
        console.log('Card copied to clipboard:', cardId)
      }
    },

    pasteCard(position: { x: number, y: number }) {
      if (!this.clipboard || !this.currentBoard) return

      const newCard: NoteCard = {
        ...this.clipboard,
        id: crypto.randomUUID(),
        position,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.currentBoard.cards.push(newCard)
      this.currentBoard.updatedAt = new Date().toISOString()

      // Sync to server
      if (typeof window !== 'undefined') {
        const { queueSync } = useSync()
        queueSync('card', 'create', { ...newCard, boardId: this.currentBoard.id })
      }

      console.log('Card pasted:', newCard.id)
      this.selectCard(newCard.id)
    },

    duplicateCard(cardId: string) {
      if (!this.currentBoard) return

      const card = this.currentBoard.cards.find(c => c.id === cardId)
      if (!card) return

      const newCard: NoteCard = {
        ...card,
        id: crypto.randomUUID(),
        position: {
          x: card.position.x + 20,
          y: card.position.y + 20
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.currentBoard.cards.push(newCard)
      this.currentBoard.updatedAt = new Date().toISOString()

      // Sync to server
      if (typeof window !== 'undefined') {
        const { queueSync } = useSync()
        queueSync('card', 'create', { ...newCard, boardId: this.currentBoard.id })
      }

      console.log('Card duplicated:', cardId, '→', newCard.id)
      this.selectCard(newCard.id)
    },

    moveCardToColumn(cardId: string, columnId: string) {
      if (!this.currentBoard) return

      const card = this.currentBoard.cards.find(c => c.id === cardId)
      const column = this.currentBoard.cards.find(c => c.id === columnId && c.type === 'column')

      if (!card || !column || card.id === columnId) {
        return
      }

      // Don't allow moving columns into columns
      if (card.type === 'column') {
        return
      }

      // Add card reference to column
      if (!column.columnCards) column.columnCards = []
      if (!column.columnCards.includes(cardId)) {
        column.columnCards.push(cardId)
      }

      // Update column timestamp
      const now = new Date().toISOString()
      column.updatedAt = now
      this.currentBoard.updatedAt = now

      // Update both the column and the card
      const cardIndex = this.currentBoard.cards.findIndex(c => c.id === cardId)
      if (cardIndex !== -1) {
        this.currentBoard.cards[cardIndex].position = { x: -10000, y: -10000 }
        this.currentBoard.cards[cardIndex].updatedAt = now
      }

      // Sync both updates in one batch
      if (typeof window !== 'undefined') {
        const { queueSync } = useSync()
        console.log('[Column] Moving card to column, syncing:', {
          columnId,
          cardId,
          columnCards: column.columnCards,
          cardPosition: this.currentBoard.cards[cardIndex]?.position
        })
        queueSync('card', 'update', { ...column, boardId: this.currentBoard.id })
        if (cardIndex !== -1) {
          queueSync('card', 'update', { ...this.currentBoard.cards[cardIndex], boardId: this.currentBoard.id })
        }
      }
    },

    removeCardFromColumn(cardId: string, columnId: string) {
      if (!this.currentBoard) return

      const column = this.currentBoard.cards.find(c => c.id === columnId && c.type === 'column')
      if (!column || !column.columnCards) return

      column.columnCards = column.columnCards.filter(id => id !== cardId)
      column.updatedAt = new Date().toISOString()
      this.currentBoard.updatedAt = new Date().toISOString()

      // Sync the column update
      if (typeof window !== 'undefined') {
        const { queueSync } = useSync()
        queueSync('card', 'update', { ...column, boardId: this.currentBoard.id })
      }
    },

    toggleSnapToGrid() {
      this.snapToGrid = !this.snapToGrid
    },

    toggleDarkMode() {
      this.darkMode = !this.darkMode
      if (typeof document !== 'undefined') {
        if (this.darkMode) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    },

    snapPositionToGrid(position: { x: number, y: number }): { x: number, y: number } {
      if (!this.snapToGrid) return position
      return {
        x: Math.round(position.x / this.gridSize) * this.gridSize,
        y: Math.round(position.y / this.gridSize) * this.gridSize
      }
    },

    addGlobalDrawingPath(path: string) {
      this.globalDrawingPaths.push(path)

      // Sync global drawing to board
      if (this.currentBoard && typeof window !== 'undefined') {
        this.currentBoard.updatedAt = new Date().toISOString()
        const { queueSync } = useSync()
        queueSync('board', 'update', {
          id: this.currentBoard.id,
          globalDrawingPaths: this.globalDrawingPaths,
          updatedAt: this.currentBoard.updatedAt
        })
      }
    },

    clearGlobalDrawing() {
      this.globalDrawingPaths = []
      if (this.currentBoard) {
        this.currentBoard.shapes = []
        this.currentBoard.connections = []
        this.currentBoard.updatedAt = new Date().toISOString()

        // Sync clearing to server
        if (typeof window !== 'undefined') {
          const { queueSync } = useSync()
          queueSync('board', 'update', {
            id: this.currentBoard.id,
            globalDrawingPaths: [],
            updatedAt: this.currentBoard.updatedAt
          })
        }
      }
      console.log('Cleared all drawings, shapes, and connections')
    },

    moveGlobalDrawingPath(pathIndex: number, dx: number, dy: number) {
      if (!this.globalDrawingPaths[pathIndex]) return

      const pathData = JSON.parse(this.globalDrawingPaths[pathIndex])
      pathData.points = pathData.points.map((point: {x: number, y: number}) => ({
        x: point.x + dx,
        y: point.y + dy
      }))
      this.globalDrawingPaths[pathIndex] = JSON.stringify(pathData)
    },

    deleteGlobalDrawingPath(pathIndex: number) {
      this.globalDrawingPaths.splice(pathIndex, 1)
    },

    addConnection(fromCardId: string, toCardId: string) {
      if (!this.currentBoard) return

      const connection = {
        id: crypto.randomUUID(),
        fromCardId,
        toCardId,
        color: '#6366F1',
        width: 2,
        style: 'curved' as const
      }

      this.currentBoard.connections.push(connection)
    },

    removeConnection(connectionId: string) {
      if (!this.currentBoard) return
      this.currentBoard.connections = this.currentBoard.connections.filter(c => c.id !== connectionId)
    },

    addShape(shape: Omit<Shape, 'id'>) {
      if (!this.currentBoard) return

      const newShape: Shape = {
        ...shape,
        id: crypto.randomUUID()
      }

      if (!this.currentBoard.shapes) {
        this.currentBoard.shapes = []
      }

      this.currentBoard.shapes.push(newShape)
      console.log('Shape added to store:', newShape.type, 'Total shapes:', this.currentBoard.shapes.length)
    },

    removeShape(shapeId: string) {
      if (!this.currentBoard) return
      this.currentBoard.shapes = this.currentBoard.shapes.filter(s => s.id !== shapeId)
    },

    saveToLocalStorage() {
      if (typeof window === 'undefined') return

      try {
        // Save boards
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.boards))

        // Save current board ID
        localStorage.setItem('katachi_current_board_id', this.currentBoard?.id || '')

        // Save viewport
        localStorage.setItem(VIEWPORT_KEY, JSON.stringify(this.viewport))

        // Save global drawings
        localStorage.setItem(DRAWING_KEY, JSON.stringify(this.globalDrawingPaths))

        // Save settings
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
          snapToGrid: this.snapToGrid,
          darkMode: this.darkMode
        }))

        console.log('Saved to localStorage')
      } catch (error) {
        console.error('Failed to save to localStorage:', error)
      }
    },

    loadFromLocalStorage() {
      if (typeof window === 'undefined') return

      try {
        // Load boards
        const boardsData = localStorage.getItem(STORAGE_KEY)
        if (boardsData) {
          this.boards = JSON.parse(boardsData)
        }

        // Load current board
        const currentBoardId = localStorage.getItem('katachi_current_board_id')
        if (currentBoardId) {
          this.currentBoard = this.boards.find(b => b.id === currentBoardId) || null
        }

        // Load viewport
        const viewportData = localStorage.getItem(VIEWPORT_KEY)
        if (viewportData) {
          this.viewport = JSON.parse(viewportData)
        }

        // Load global drawings
        const drawingData = localStorage.getItem(DRAWING_KEY)
        if (drawingData) {
          this.globalDrawingPaths = JSON.parse(drawingData)
        }

        // Load settings
        const settingsData = localStorage.getItem(SETTINGS_KEY)
        if (settingsData) {
          const settings = JSON.parse(settingsData)
          this.snapToGrid = settings.snapToGrid || false
          this.darkMode = settings.darkMode || false

          // Apply dark mode to document
          if (this.darkMode && typeof document !== 'undefined') {
            document.documentElement.classList.add('dark')
          }
        }

        console.log('Loaded from localStorage:', this.boards.length, 'boards')
      } catch (error) {
        console.error('Failed to load from localStorage:', error)
      }
    },

    addImageCard(position: { x: number, y: number }, imageUrl: string, size?: { width: number, height: number }): NoteCard {
      if (!this.currentBoard) throw new Error('No active board')

      const maxZIndex = this.currentBoard.cards.reduce((max, c) => Math.max(max, c.zIndex), 0)
      const now = new Date().toISOString()
      const newCard: NoteCard = {
        id: crypto.randomUUID(),
        type: 'image',
        position,
        size: size || { width: 300, height: 300 },
        content: '',
        imageUrl,
        zIndex: maxZIndex + 1,
        createdAt: now,
        updatedAt: now
      }

      this.currentBoard.cards.push(newCard)
      this.currentBoard.updatedAt = now

      // Sync to server
      if (typeof window !== 'undefined') {
        const { queueSync } = useSync()
        console.log('[Image] Queueing sync with imageUrl length:', imageUrl.length)
        queueSync('card', 'create', { ...newCard, boardId: this.currentBoard.id })
      }

      return newCard
    },

    addColumnCard(position: { x: number, y: number }): NoteCard {
      if (!this.currentBoard) throw new Error('No active board')

      const maxZIndex = this.currentBoard.cards.reduce((max, c) => Math.max(max, c.zIndex), 0)
      const now = new Date().toISOString()
      const newCard: NoteCard = {
        id: crypto.randomUUID(),
        type: 'column',
        position,
        size: { width: 250, height: 500 },
        content: 'New Column',
        columnCards: [],
        color: '#f3f4f6',
        zIndex: maxZIndex + 1,
        createdAt: now,
        updatedAt: now
      }

      this.currentBoard.cards.push(newCard)
      this.currentBoard.updatedAt = now

      // Sync to server
      if (typeof window !== 'undefined') {
        const { queueSync } = useSync()
        queueSync('card', 'create', { ...newCard, boardId: this.currentBoard.id })
      }

      return newCard
    },

    addDrawingCard(position: { x: number, y: number }): NoteCard {
      if (!this.currentBoard) throw new Error('No active board')

      const maxZIndex = this.currentBoard.cards.reduce((max, c) => Math.max(max, c.zIndex), 0)
      const now = new Date().toISOString()
      const newCard: NoteCard = {
        id: crypto.randomUUID(),
        type: 'drawing',
        position,
        size: { width: 400, height: 400 },
        content: '',
        drawingData: { paths: [], color: '#000000', width: 2 },
        color: '#ffffff',
        zIndex: maxZIndex + 1,
        createdAt: now,
        updatedAt: now
      }

      this.currentBoard.cards.push(newCard)
      this.currentBoard.updatedAt = now

      // Sync to server
      if (typeof window !== 'undefined') {
        const { queueSync } = useSync()
        queueSync('card', 'create', { ...newCard, boardId: this.currentBoard.id })
      }

      return newCard
    },

    addStoryboardCard(position: { x: number, y: number }): NoteCard {
      if (!this.currentBoard) throw new Error('No active board')

      const maxZIndex = this.currentBoard.cards.reduce((max, c) => Math.max(max, c.zIndex), 0)
      const now = new Date().toISOString()
      const newCard: NoteCard = {
        id: crypto.randomUUID(),
        type: 'storyboard',
        position,
        size: { width: 600, height: 400 },
        content: 'Storyboard',
        storyboardData: {
          title: 'New Storyboard',
          frames: [
            { id: crypto.randomUUID(), caption: 'Frame 1', notes: '' },
            { id: crypto.randomUUID(), caption: 'Frame 2', notes: '' },
            { id: crypto.randomUUID(), caption: 'Frame 3', notes: '' }
          ]
        },
        color: '#ffffff',
        zIndex: maxZIndex + 1,
        createdAt: now,
        updatedAt: now
      }

      this.currentBoard.cards.push(newCard)
      this.currentBoard.updatedAt = now

      // Sync to server
      if (typeof window !== 'undefined') {
        const { queueSync } = useSync()
        queueSync('card', 'create', { ...newCard, boardId: this.currentBoard.id })
      }

      return newCard
    }
  }
})
