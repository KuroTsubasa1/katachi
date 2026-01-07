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
          name: this.currentBoard.name,
          backgroundColor: this.currentBoard.backgroundColor,
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
            name: this.currentBoard.name,
            backgroundColor: this.currentBoard.backgroundColor,
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

      // Sync deletion to server
      if (this.currentBoard && typeof window !== 'undefined') {
        this.currentBoard.updatedAt = new Date().toISOString()
        console.log('[Store] Syncing stroke deletion, remaining paths:', this.globalDrawingPaths.length)
        const { queueSync } = useSync()
        queueSync('board', 'update', {
          id: this.currentBoard.id,
          name: this.currentBoard.name,
          backgroundColor: this.currentBoard.backgroundColor,
          globalDrawingPaths: this.globalDrawingPaths,
          updatedAt: this.currentBoard.updatedAt
        })
      }
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
      this.currentBoard.updatedAt = new Date().toISOString()

      console.log('Shape added to store:', newShape.type, 'Total shapes:', this.currentBoard.shapes.length)

      // Sync to server
      if (typeof window !== 'undefined') {
        const { queueSync } = useSync()
        queueSync('shape', 'create', { ...newShape, boardId: this.currentBoard.id })
      }
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
    },

    // ==================== PHOTOGRAPHY/VIDEOGRAPHY CARD CREATION ====================

    addShotListCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'shot-list',
        position,
        size: { width: 700, height: 450 },
        content: '',
        shotListData: {
          title: 'Shot List',
          items: []
        },
        color: '#fff7ed'
      })
    },

    addEquipmentChecklistCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'equipment-checklist',
        position,
        size: { width: 500, height: 400 },
        content: '',
        equipmentChecklistData: {
          title: 'Equipment Checklist',
          items: []
        },
        color: '#f0fdf4'
      })
    },

    addCameraSettingsCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'camera-settings',
        position,
        size: { width: 450, height: 400 },
        content: '',
        cameraSettingsData: {
          title: 'Camera Settings',
          presets: []
        },
        color: '#eff6ff'
      })
    },

    addReleaseFormTrackerCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'release-form-tracker',
        position,
        size: { width: 700, height: 400 },
        content: '',
        releaseFormTrackerData: {
          title: 'Release Form Tracker',
          entries: []
        },
        color: '#fef2f2'
      })
    },

    addFileNamingConventionCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'file-naming-convention',
        position,
        size: { width: 450, height: 400 },
        content: '',
        fileNamingConventionData: {
          title: 'File Naming Convention',
          pattern: '{project}_{date}_{scene}_{take}',
          rules: [],
          separatorType: 'underscore',
          exampleOutput: 'project_2025-01-07_scene01_take03.mp4'
        },
        color: '#faf5ff'
      })
    },

    addMoodBoardCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'mood-board',
        position,
        size: { width: 500, height: 500 },
        content: '',
        moodBoardData: {
          title: 'Mood Board',
          images: [],
          layout: '3x3'
        },
        color: '#faf5ff'
      })
    },

    addContactSheetCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'contact-sheet',
        position,
        size: { width: 600, height: 500 },
        content: '',
        contactSheetData: {
          title: 'Contact Sheet',
          images: [],
          thumbnailSize: 'medium',
          columns: 4,
          showFilenames: true
        },
        color: '#ffffff'
      })
    },

    addTalentModelCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'talent-model',
        position,
        size: { width: 400, height: 600 },
        content: '',
        talentModelData: {
          name: 'New Talent',
          role: '',
          contact: { email: '', phone: '' },
          portfolioImages: [],
          measurements: '',
          notes: '',
          socialMedia: []
        },
        color: '#fff7ed'
      })
    },

    addExifDataViewerCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'exif-viewer',
        position,
        size: { width: 500, height: 450 },
        content: '',
        exifDataViewerData: {
          imageUrl: '',
          exifData: null,
          displayMode: 'detailed'
        },
        color: '#ffffff'
      })
    },

    addColorPaletteCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'color-palette',
        position,
        size: { width: 450, height: 400 },
        content: '',
        colorPaletteData: {
          imageUrl: '',
          colors: [],
          paletteSize: 5,
          sortBy: 'dominance'
        },
        color: '#ffffff'
      })
    },

    addBeforeAfterCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'before-after',
        position,
        size: { width: 500, height: 400 },
        content: '',
        beforeAfterData: {
          beforeImageUrl: '',
          afterImageUrl: '',
          sliderPosition: 50,
          labels: { before: 'Before', after: 'After' }
        },
        color: '#ffffff'
      })
    },

    addLocationScoutCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'location-scout',
        position,
        size: { width: 500, height: 600 },
        content: '',
        locationScoutData: {
          locationName: '',
          address: '',
          coordinates: undefined,
          images: [],
          notes: '',
          accessibility: '',
          permits: ''
        },
        color: '#f0fdf4'
      })
    },

    addLUTReferenceCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'lut-reference',
        position,
        size: { width: 500, height: 450 },
        content: '',
        lutReferenceData: {
          title: 'LUT Reference',
          luts: []
        },
        color: '#faf5ff'
      })
    },

    addCallSheetCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'call-sheet',
        position,
        size: { width: 600, height: 500 },
        content: '',
        callSheetData: {
          title: 'Call Sheet',
          shootDate: '',
          callTime: '',
          wrapTime: '',
          entries: [],
          contacts: []
        },
        color: '#eff6ff'
      })
    },

    addWeatherPlanningCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'weather-planning',
        position,
        size: { width: 450, height: 450 },
        content: '',
        weatherPlanningData: {
          location: '',
          date: new Date().toISOString().split('T')[0],
          sunrise: '',
          sunset: '',
          goldenHourMorning: { start: '', end: '' },
          goldenHourEvening: { start: '', end: '' },
          blueHour: { start: '', end: '' },
          weather: '',
          backupPlan: ''
        },
        color: '#fef3c7'
      })
    },

    addScriptBreakdownCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'script-breakdown',
        position,
        size: { width: 600, height: 500 },
        content: '',
        scriptBreakdownData: {
          title: 'Script Breakdown',
          scenes: []
        },
        color: '#fff7ed'
      })
    },

    addEditDecisionListCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'edit-decision-list',
        position,
        size: { width: 650, height: 450 },
        content: '',
        editDecisionListData: {
          title: 'Edit Decision List',
          projectName: '',
          decisions: []
        },
        color: '#f0f9ff'
      })
    },

    addDeliverySpecsCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'delivery-specs',
        position,
        size: { width: 500, height: 450 },
        content: '',
        deliverySpecsData: {
          title: 'Delivery Specs',
          client: '',
          dueDate: '',
          specs: []
        },
        color: '#fef2f2'
      })
    },

    addBudgetTrackerCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'budget-tracker',
        position,
        size: { width: 600, height: 450 },
        content: '',
        budgetTrackerData: {
          title: 'Budget Tracker',
          currency: 'USD',
          totalBudget: 0,
          items: [],
          totalSpent: 0,
          remaining: 0
        },
        color: '#f0fdf4'
      })
    },

    addDepthOfFieldCalculatorCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'dof-calculator',
        position,
        size: { width: 400, height: 400 },
        content: '',
        depthOfFieldData: {
          focalLength: 50,
          aperture: 2.8,
          subjectDistance: 3,
          sensorSize: 'full-frame',
          calculatedDOF: null
        },
        color: '#eff6ff'
      })
    },

    addTimeLapseCalculatorCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'timelapse-calculator',
        position,
        size: { width: 400, height: 350 },
        content: '',
        timeLapseCalculatorData: {
          eventDuration: 60,
          clipLength: 10,
          fps: 24,
          calculatedInterval: null,
          calculatedFrames: null,
          estimatedFileSize: null
        },
        color: '#eff6ff'
      })
    },

    addLensSimulatorCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'lens-simulator',
        position,
        size: { width: 500, height: 450 },
        content: '',
        lensSimulatorData: {
          referenceImageUrl: '',
          currentFocalLength: 50,
          focalLengths: [14, 24, 35, 50, 85, 135, 200],
          sensorSize: 'full-frame',
          cropFactor: 1
        },
        color: '#eff6ff'
      })
    },

    addAspectRatioFrameCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'aspect-ratio-frame',
        position,
        size: { width: 500, height: 450 },
        content: '',
        aspectRatioFrameData: {
          imageUrl: '',
          aspectRatio: '16:9',
          customRatio: undefined,
          cropPosition: { x: 0, y: 0 },
          overlayColor: '#000000',
          overlayOpacity: 0.5
        },
        color: '#ffffff'
      })
    },

    addTimecodeNotesCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'timecode-notes',
        position,
        size: { width: 600, height: 500 },
        content: '',
        timecodeNotesData: {
          title: 'Timecode Notes',
          videoUrl: '',
          notes: []
        },
        color: '#f0f9ff'
      })
    },

    addShotSequenceCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'shot-sequence',
        position,
        size: { width: 600, height: 450 },
        content: '',
        shotSequenceData: {
          title: 'Shot Sequence',
          frames: [],
          sequenceType: 'linear'
        },
        color: '#faf5ff'
      })
    },

    addClientFeedbackCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'client-feedback',
        position,
        size: { width: 500, height: 450 },
        content: '',
        clientFeedbackData: {
          title: 'Client Feedback',
          version: 'v1.0',
          feedback: []
        },
        color: '#fef3c7'
      })
    },

    addLightingDiagramCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'lighting-diagram',
        position,
        size: { width: 700, height: 600 },
        content: '',
        lightingDiagramData: {
          title: 'Lighting Setup',
          lights: [],
          subject: { x: 350, y: 300, icon: 'person' },
          background: { x: 350, y: 100 },
          camera: { x: 350, y: 500, rotation: 0 },
          annotations: [],
          measurements: [],
          drawingPaths: []
        },
        color: '#fffbeb'
      })
    },

    addCameraMovementDiagramCard(position: { x: number, y: number }): NoteCard {
      return this.addCard({
        type: 'camera-movement',
        position,
        size: { width: 600, height: 500 },
        content: '',
        cameraMovementData: {
          title: 'Camera Movement',
          movementType: 'dolly',
          drawingPaths: [],
          annotations: [],
          startPosition: { x: 100, y: 400 },
          endPosition: { x: 500, y: 400 }
        },
        color: '#eff6ff'
      })
    }
  }
})
