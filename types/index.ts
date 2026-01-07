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

// ==================== PHOTOGRAPHY/VIDEOGRAPHY CARD TYPES ====================

// Pre-Production Card Data Structures

export interface ShotListItem {
  id: string
  shotNumber: string
  shotType: string
  subject: string
  camera: string
  lens: string
  notes: string
  completed: boolean
}

export interface ShotListData {
  title: string
  items: ShotListItem[]
}

export interface MoodBoardData {
  title: string
  images: string[]
  layout: '2x2' | '3x3' | '4x4'
}

export interface LocationScoutData {
  locationName: string
  address: string
  coordinates?: { lat: number; lng: number }
  images: string[]
  notes: string
  accessibility: string
  permits: string
}

export interface CallSheetEntry {
  id: string
  time: string
  activity: string
  location: string
  people: string[]
  notes: string
}

export interface CallSheetData {
  title: string
  shootDate: string
  callTime: string
  wrapTime: string
  entries: CallSheetEntry[]
  contacts: { name: string; role: string; phone: string }[]
}

export interface EquipmentItem {
  id: string
  name: string
  category: 'camera' | 'lens' | 'lighting' | 'audio' | 'grip' | 'other'
  checked: boolean
  quantity: number
  notes: string
}

export interface EquipmentChecklistData {
  title: string
  items: EquipmentItem[]
}

export interface TalentModelData {
  name: string
  role: string
  contact: { email: string; phone: string }
  portfolioImages: string[]
  measurements: string
  notes: string
  socialMedia: { platform: string; handle: string }[]
}

export interface ReleaseFormEntry {
  id: string
  personName: string
  releaseType: 'model' | 'property' | 'location'
  signed: boolean
  signedDate?: string
  expiryDate?: string
  notes: string
}

export interface ReleaseFormTrackerData {
  title: string
  entries: ReleaseFormEntry[]
}

export interface WeatherPlanningData {
  location: string
  date: string
  sunrise: string
  sunset: string
  goldenHourMorning: { start: string; end: string }
  goldenHourEvening: { start: string; end: string }
  blueHour: { start: string; end: string }
  weather: string
  backupPlan: string
}

export interface SceneBreakdownItem {
  id: string
  sceneNumber: string
  description: string
  location: string
  timeOfDay: string
  talent: string[]
  props: string[]
  equipment: string[]
  notes: string
}

export interface ScriptBreakdownData {
  title: string
  scenes: SceneBreakdownItem[]
}

// Technical/Creative Card Data Structures

export interface LightIcon {
  id: string
  type: 'key' | 'fill' | 'back' | 'rim' | 'hair' | 'background' | 'practical'
  position: { x: number; y: number }
  rotation: number
  power: string
  modifier: string
  color: string
}

export interface LightingDiagramData {
  title: string
  lights: LightIcon[]
  subject: { x: number; y: number; icon: 'person' | 'product' | 'custom' }
  background: { x: number; y: number }
  camera: { x: number; y: number; rotation: number }
  annotations: { id: string; text: string; position: { x: number; y: number } }[]
  measurements: { id: string; from: { x: number; y: number }; to: { x: number; y: number }; distance: string }[]
  drawingPaths: string[]
}

export interface ExifData {
  camera: string
  lens: string
  focalLength: string
  aperture: string
  shutterSpeed: string
  iso: string
  exposureCompensation: string
  whiteBalance: string
  flashUsed: boolean
  dateTaken: string
  gpsLocation?: { lat: number; lng: number }
}

export interface ExifDataViewerData {
  imageUrl: string
  exifData: ExifData | null
  displayMode: 'compact' | 'detailed'
}

export interface ColorPaletteData {
  imageUrl: string
  colors: { hex: string; rgb: string; percentage: number }[]
  paletteSize: 5 | 8 | 12
  sortBy: 'dominance' | 'hue' | 'brightness'
}

export interface AspectRatioFrameData {
  imageUrl: string
  aspectRatio: '1:1' | '4:3' | '16:9' | '2.35:1' | '4:5' | '9:16' | 'custom'
  customRatio?: { width: number; height: number }
  cropPosition: { x: number; y: number }
  overlayColor: string
  overlayOpacity: number
}

export interface DepthOfFieldData {
  focalLength: number
  aperture: number
  subjectDistance: number
  sensorSize: 'full-frame' | 'aps-c' | 'micro-four-thirds' | 'medium-format'
  calculatedDOF: { near: number; far: number; total: number; hyperFocal: number } | null
}

export interface CameraPreset {
  id: string
  name: string
  camera: string
  iso: string
  aperture: string
  shutterSpeed: string
  whiteBalance: string
  notes: string
}

export interface CameraSettingsData {
  title: string
  presets: CameraPreset[]
}

export interface ShotSequenceFrame {
  id: string
  imageUrl?: string
  caption: string
  order: number
  arrow?: { to: string; label: string }
}

export interface ShotSequenceData {
  title: string
  frames: ShotSequenceFrame[]
  sequenceType: 'linear' | 'branching'
}

export interface LensSimulatorData {
  referenceImageUrl: string
  currentFocalLength: number
  focalLengths: number[]
  sensorSize: 'full-frame' | 'aps-c'
  cropFactor: number
}

export interface CameraMovementData {
  title: string
  movementType: 'dolly' | 'pan' | 'tilt' | 'crane' | 'steadicam' | 'handheld' | 'slider'
  drawingPaths: string[]
  annotations: { id: string; text: string; position: { x: number; y: number } }[]
  startPosition: { x: number; y: number }
  endPosition: { x: number; y: number }
}

export interface TimeLapseCalculatorData {
  eventDuration: number
  clipLength: number
  fps: number
  calculatedInterval: number | null
  calculatedFrames: number | null
  estimatedFileSize: number | null
}

// Production Card Data Structures

export interface TimecodeNote {
  id: string
  timecode: string
  note: string
  category: 'good' | 'issue' | 'retake' | 'favorite'
  color: string
}

export interface TimecodeNotesData {
  title: string
  videoUrl: string
  notes: TimecodeNote[]
}

export interface BeforeAfterData {
  beforeImageUrl: string
  afterImageUrl: string
  sliderPosition: number
  labels: { before: string; after: string }
}

export interface ContactSheetData {
  title: string
  images: string[]
  thumbnailSize: 'small' | 'medium' | 'large'
  columns: number
  showFilenames: boolean
}

// Post-Production Card Data Structures

export interface EditDecision {
  id: string
  inPoint: string
  outPoint: string
  clipName: string
  track: number
  action: 'cut' | 'transition' | 'effect' | 'audio'
  notes: string
}

export interface EditDecisionListData {
  title: string
  projectName: string
  decisions: EditDecision[]
}

export interface FeedbackItem {
  id: string
  timestamp: string
  author: string
  comment: string
  status: 'pending' | 'in-progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  attachmentUrl?: string
}

export interface ClientFeedbackData {
  title: string
  version: string
  feedback: FeedbackItem[]
}

export interface LUTReference {
  id: string
  name: string
  category: 'cinematic' | 'vintage' | 'modern' | 'black-white' | 'custom'
  previewImageUrl: string
  notes: string
  settings?: { contrast: number; saturation: number; temperature: number }
}

export interface LUTReferenceData {
  title: string
  luts: LUTReference[]
}

export interface DeliverySpec {
  id: string
  platform: string
  resolution: string
  frameRate: string
  codec: string
  bitrate: string
  audioCodec: string
  containerFormat: string
  colorSpace: string
}

export interface DeliverySpecsData {
  title: string
  client: string
  dueDate: string
  specs: DeliverySpec[]
}

export interface FileNamingRule {
  id: string
  component: string
  format: string
  example: string
}

export interface FileNamingConventionData {
  title: string
  pattern: string
  rules: FileNamingRule[]
  separatorType: 'underscore' | 'dash' | 'camelCase'
  exampleOutput: string
}

export interface BudgetLineItem {
  id: string
  category: 'equipment' | 'talent' | 'location' | 'post' | 'travel' | 'misc'
  description: string
  estimated: number
  actual: number
  paid: boolean
  notes: string
}

export interface BudgetTrackerData {
  title: string
  currency: string
  totalBudget: number
  items: BudgetLineItem[]
  totalSpent: number
  remaining: number
}

export interface NoteCard {
  id: string
  type: 'text' | 'richtext' | 'image' | 'column' | 'drawing' | 'audio' | 'video' | 'map' | 'link' | 'table' | 'todo' | 'markdown' | 'storyboard' |
        // Pre-production
        'shot-list' | 'mood-board' | 'location-scout' | 'call-sheet' | 'equipment-checklist' |
        'talent-model' | 'release-form-tracker' | 'weather-planning' | 'script-breakdown' |
        // Technical/Creative
        'lighting-diagram' | 'exif-viewer' | 'color-palette' | 'aspect-ratio-frame' | 'dof-calculator' |
        'camera-settings' | 'shot-sequence' | 'lens-simulator' | 'camera-movement' | 'timelapse-calculator' |
        // Production
        'timecode-notes' | 'before-after' | 'contact-sheet' |
        // Post-production
        'edit-decision-list' | 'client-feedback' | 'lut-reference' | 'delivery-specs' |
        'file-naming-convention' | 'budget-tracker'
  position: Position
  size: Size
  content: string

  // Existing card data
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

  // Photography/Videography card data
  shotListData?: ShotListData
  moodBoardData?: MoodBoardData
  locationScoutData?: LocationScoutData
  callSheetData?: CallSheetData
  equipmentChecklistData?: EquipmentChecklistData
  talentModelData?: TalentModelData
  releaseFormTrackerData?: ReleaseFormTrackerData
  weatherPlanningData?: WeatherPlanningData
  scriptBreakdownData?: ScriptBreakdownData
  lightingDiagramData?: LightingDiagramData
  exifDataViewerData?: ExifDataViewerData
  colorPaletteData?: ColorPaletteData
  aspectRatioFrameData?: AspectRatioFrameData
  depthOfFieldData?: DepthOfFieldData
  cameraSettingsData?: CameraSettingsData
  shotSequenceData?: ShotSequenceData
  lensSimulatorData?: LensSimulatorData
  cameraMovementData?: CameraMovementData
  timeLapseCalculatorData?: TimeLapseCalculatorData
  timecodeNotesData?: TimecodeNotesData
  beforeAfterData?: BeforeAfterData
  contactSheetData?: ContactSheetData
  editDecisionListData?: EditDecisionListData
  clientFeedbackData?: ClientFeedbackData
  lutReferenceData?: LUTReferenceData
  deliverySpecsData?: DeliverySpecsData
  fileNamingConventionData?: FileNamingConventionData
  budgetTrackerData?: BudgetTrackerData

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
  globalDrawingPaths?: string[]
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
  type: 'select' | 'pen' | 'eraser' | 'move-stroke' | 'hand' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'connect' | 'text' | 'image' | 'column'
  color?: string
  width?: number
}
