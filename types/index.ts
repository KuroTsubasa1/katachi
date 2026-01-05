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

export interface NoteCard {
  id: string
  type: 'text' | 'richtext' | 'image' | 'column' | 'drawing' | 'audio' | 'video' | 'map' | 'link' | 'table' | 'todo' | 'markdown'
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
  name: string
  cards: NoteCard[]
  backgroundColor: string
  createdAt: string
  updatedAt: string
}

export interface ViewPort {
  x: number
  y: number
  scale: number
}

export interface Tool {
  type: 'select' | 'pen' | 'eraser' | 'move-stroke' | 'text' | 'image' | 'column'
  color?: string
  width?: number
}
