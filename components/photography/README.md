# Photography Components

This directory contains specialized Vue components for photography and videography planning, production, and post-production workflows in Mila Note.

## Component List

### Pre-Production
- **ShotListCard.vue** - Organize and track individual shots
- **MoodBoardCard.vue** - Visual reference collection
- **EquipmentChecklistCard.vue** - Track gear and equipment
- **ReleaseFormTrackerCard.vue** - Track legal releases
- **FileNamingConventionCard.vue** - File naming standards
- **CameraSettingsCard.vue** - Save camera presets

### Technical/Creative (Canvas-Based)
- **LightingDiagramCard.vue** - Interactive lighting setup planner with drag-and-drop lights
- **CameraMovementDiagramCard.vue** - Visual camera movement documentation with path drawing

## Advanced Canvas Components

### LightingDiagramCard.vue

Full-featured canvas editor for creating lighting diagrams.

**Features:**
- 7 light types (key, fill, back, rim, hair, background, practical)
- Draggable lights, subject, and camera
- Properties panel (power, modifier, color, rotation)
- Drawing tools for custom paths
- Annotation system
- SVG icon rendering
- Grid-based canvas

**Usage:**
```vue
<LightingDiagramCard :card="card" />
```

**Data Structure:**
```typescript
interface LightingDiagramData {
  title: string
  lights: LightIcon[]
  subject: { x: number; y: number; icon: 'person' | 'product' | 'custom' }
  camera: { x: number; y: number; rotation: number }
  annotations: { id: string; text: string; position: Position }[]
  drawingPaths: string[]
}
```

### CameraMovementDiagramCard.vue

Path drawing canvas for documenting camera movements.

**Features:**
- 7 movement types (dolly, pan, tilt, crane, steadicam, handheld, slider)
- Path styles (solid, dashed, arrow)
- Start/end markers
- Color and width customization
- Annotation system
- Movement type indicator

**Usage:**
```vue
<CameraMovementDiagramCard :card="card" />
```

**Data Structure:**
```typescript
interface CameraMovementData {
  title: string
  movementType: 'dolly' | 'pan' | 'tilt' | 'crane' | 'steadicam' | 'handheld' | 'slider'
  drawingPaths: string[]
  annotations: { id: string; text: string; position: Position }[]
  startPosition: Position
  endPosition: Position
}
```

## Shared Dependencies

### Composables
- **useDraggableCanvas** (`/composables/useDraggableCanvas.ts`)
  - Provides drag-and-drop functionality
  - Manages draggable items state
  - Handles selection and positioning

### Utilities
- **photographyHelpers** (`/utils/photographyHelpers.ts`)
  - `getLightingIcon(type, color)` - Generate light SVG icons
  - `getCameraIcon(rotation)` - Generate camera SVG icon
  - `getSubjectIcon(type)` - Generate subject SVG icon
  - Additional calculation and formatting utilities

### Store
- **Canvas Store** (`/stores/canvas.ts`)
  - `addLightingDiagramCard(position)` - Create lighting diagram
  - `addCameraMovementDiagramCard(position)` - Create camera movement diagram
  - `updateCard(id, data)` - Persist card data

## Architecture

### Component Structure

```
Component
├── Template
│   ├── Toolbar (controls)
│   ├── Canvas (rendering)
│   └── Properties Panel (selected item)
├── Script Setup
│   ├── Composables (useDraggableCanvas)
│   ├── State (local data, refs)
│   ├── Methods (add, render, update)
│   └── Lifecycle (onMounted, watch)
└── Dependencies
    ├── Canvas Store
    ├── Photography Helpers
    └── Type Definitions
```

### Data Flow

```
User Action
  ↓
Event Handler
  ↓
Composable Method
  ↓
Update Local State
  ↓
Render Canvas
  ↓
Update Store
  ↓
Persist to Backend
  ↓
Sync to Other Clients
```

## Design Principles

### SOLID Principles
- **Single Responsibility**: Each component handles one specific task
- **Open/Closed**: Extensible through composables and utilities
- **Liskov Substitution**: All components use same NoteCard interface
- **Interface Segregation**: Minimal, focused composable interfaces
- **Dependency Inversion**: Depend on abstractions (composables, store)

### Additional Principles
- **DRY**: Shared logic in composables and utilities
- **KISS**: Straightforward implementations
- **YAGNI**: Only essential features
- **POLA**: Intuitive, predictable behavior

## Canvas Rendering

### Rendering Pipeline

1. **Clear Canvas** - Remove previous frame
2. **Draw Background** - Grid pattern
3. **Draw Paths** - Saved and current drawing paths
4. **Draw Items** - Lights, subject, camera, annotations
5. **Draw Selection** - Highlight selected item

### Performance

- Target: 60 FPS during drag operations
- Optimized for canvases up to 1920×1080
- Tested with 50+ items
- Path complexity: up to 1000 points

## Event Handling

### Mouse Events

```javascript
handleMouseDown(event)  // Start drag or drawing
handleMouseMove(event)  // Continue drag or drawing
handleMouseUp()         // End drag or drawing
```

### State Management

```javascript
// Component State
localData: Ref<DiagramData>
isDrawing: Ref<boolean>
drawingPath: Ref<Point[]>

// Composable State
items: Ref<DraggableItem[]>
selectedItem: ComputedRef<DraggableItem | null>
draggingItemId: Ref<string | null>

// Store State
currentBoard: Ref<Board>
cards: Ref<NoteCard[]>
```

## Common Workflows

### Creating a Lighting Setup

1. Create lighting diagram card
2. Add subject to center
3. Add key light (45° left)
4. Add fill light (45° right)
5. Add back light (behind)
6. Position camera
7. Configure light properties
8. Add annotations for crew

### Documenting Camera Movement

1. Create camera movement card
2. Select movement type
3. Add start marker
4. Add end marker
5. Draw movement path
6. Customize path style
7. Add timing annotations
8. Save for reference

## Testing

### Unit Tests
```javascript
describe('LightingDiagramCard', () => {
  it('adds light to canvas')
  it('drags light to new position')
  it('updates light properties')
  it('removes selected light')
  it('persists data to store')
})
```

### Integration Tests
```javascript
describe('Canvas Integration', () => {
  it('creates diagram from store')
  it('synchronizes across clients')
  it('exports diagram as image')
})
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Required APIs:**
- HTML5 Canvas
- ES6+ JavaScript
- Vue 3 Composition API

## Known Limitations

1. No undo/redo for drawing operations
2. Single layer (no layer management)
3. No SVG export (PNG only)
4. Limited shapes (freehand only)
5. No snap-to-grid

## Future Enhancements

### Planned Features
- [ ] Undo/redo stack
- [ ] Layer management
- [ ] SVG/PDF export
- [ ] Geometric shapes
- [ ] Snap-to-grid
- [ ] Measurement tools
- [ ] Keyboard shortcuts
- [ ] Touch device support
- [ ] Pre-configured lighting setups
- [ ] Bezier curve paths
- [ ] Timeline integration
- [ ] Animation preview

## Documentation

### Full Documentation
- [Photography Canvas Components](../../docs/photography-canvas-components.md) - Technical documentation
- [Quick Start Guide](../../docs/photography-canvas-quick-start.md) - User guide with examples
- [Architecture](../../docs/photography-canvas-architecture.md) - Architecture diagrams
- [Components Overview](../../docs/photography-components-overview.md) - Complete component list

### Quick Links
- [Getting Started](../../docs/getting-started.md)
- [Architecture Overview](../../docs/architecture.md)
- [Contributing Guide](../../docs/contributing.md)

## Examples

### Three-Point Lighting

```javascript
// Add subject
addItem({ id: 'subject', position: { x: 400, y: 300 }, type: 'subject' })

// Add key light
addItem({
  id: 'key',
  position: { x: 300, y: 200 },
  type: 'key',
  power: '1000W',
  modifier: 'Softbox',
  color: '#FFA500'
})

// Add fill light
addItem({
  id: 'fill',
  position: { x: 500, y: 250 },
  type: 'fill',
  power: '500W',
  modifier: 'Umbrella',
  color: '#FFA500'
})

// Add back light
addItem({
  id: 'back',
  position: { x: 400, y: 100 },
  type: 'back',
  power: '750W',
  modifier: 'Bare Bulb',
  color: '#FFA500'
})
```

### Dolly Shot

```javascript
// Set movement type
localData.movementType = 'dolly'

// Add start marker
addItem({ id: 'start', position: { x: 100, y: 300 }, type: 'start', label: 'Start' })

// Add end marker
addItem({ id: 'end', position: { x: 700, y: 300 }, type: 'end', label: 'End' })

// Draw path (done via user interaction)
// Add annotations
addItem({
  id: 'note1',
  position: { x: 400, y: 200 },
  type: 'annotation',
  label: 'Slow push in, 5 seconds'
})
```

## Troubleshooting

### Canvas Not Rendering
- Check if `canvasRef` is properly bound
- Verify canvas dimensions are set
- Ensure `renderCanvas()` is called after setup

### Items Not Dragging
- Confirm mouse events are bound
- Check drag offset calculation
- Verify canvas element is passed to handlers

### Data Not Persisting
- Ensure `updateData()` is called after changes
- Verify store update method is working
- Check if card ID is valid

## Contributing

We welcome contributions! To add features or fix bugs:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Update documentation
6. Submit a pull request

### Code Style
- Follow Vue 3 Composition API patterns
- Use TypeScript for type safety
- Follow SOLID principles
- Add JSDoc comments
- Write comprehensive tests

## Support

- **GitHub Issues**: Report bugs or request features
- **Discord**: Join the community for help
- **Documentation**: Check the docs for detailed information

## License

See the main project LICENSE file.

---

**Component Files:**
- LightingDiagramCard.vue (17KB)
- CameraMovementDiagramCard.vue (18KB)
- ShotListCard.vue
- MoodBoardCard.vue
- EquipmentChecklistCard.vue
- CameraSettingsCard.vue
- ReleaseFormTrackerCard.vue
- FileNamingConventionCard.vue

**Last Updated**: 2026-01-07
**Version**: 1.0.0
