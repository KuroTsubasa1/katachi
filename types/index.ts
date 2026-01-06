export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface DrawingData {
  paths: string[]
  color: string
  width: number
}

export interface TableData {
  rows: number
  cols: number
  cells: string[][]
}

export interface TodoItem {
  text: string
  completed: boolean
}

export interface TodoData {
  title: string
  items: TodoItem[]
}

export interface StoryboardFrame {
  id: string
  imageUrl?: string
  caption: string
  notes?: string
}

export interface StoryboardData {
  title: string
  frames: StoryboardFrame[]
}

export interface NoteCard {
  id: string
  type: 'text' | 'richtext' | 'image' | 'column' | 'drawing' | 'audio' | 'video' | 'map' | 'link' | 'table' | 'todo' | 'markdown' | 'storyboard'
  position: Position
  size: Size
  content: string
  htmlContent?: string
  imageUrl?: string
  imagePath?: string
  drawingData?: DrawingData
  columnCards?: string[]
  tableData?: TableData
  todoData?: TodoData
  storyboardData?: StoryboardData
  markdown?: string
  url?: string
  audioUrl?: string
  videoUrl?: string
  mapLocation?: string
  mapCoordinates?: { lat: number, lng: number }
  color?: string
  isDragging?: boolean
  zIndex: number
  createdAt: string
  updatedAt: string
}

export interface Board {
  id: string
  userId?: string
  name: string
  cards: NoteCard[]
  connections: Connection[]
  shapes: Shape[]
  backgroundColor: string
  createdAt: string
  updatedAt: string
}

export interface ViewPort {
  x: number
  y: number
  scale: number
}

export interface Connection {
  id: string
  fromCardId: string
  toCardId: string
  color: string
  width: number
  style: 'straight' | 'curved'
}

export interface Shape {
  id: string
  type: 'rectangle' | 'circle' | 'line' | 'arrow'
  position: Position
  size: Size
  color: string
  width: number
  fill?: boolean
}

export interface Tool {
  type: 'select' | 'pen' | 'eraser' | 'move-stroke' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'connect' | 'text' | 'image' | 'column'
  color?: string
  width?: number
}
