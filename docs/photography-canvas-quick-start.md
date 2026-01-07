# Photography Canvas Components - Quick Start Guide

This guide provides a quick introduction to using the Lighting Diagram and Camera Movement Diagram components in Mila Note.

## Table of Contents
1. [Creating Canvas Cards](#creating-canvas-cards)
2. [Lighting Diagram Basics](#lighting-diagram-basics)
3. [Camera Movement Diagram Basics](#camera-movement-diagram-basics)
4. [Common Workflows](#common-workflows)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Tips and Tricks](#tips-and-tricks)

---

## Creating Canvas Cards

### From the Canvas Store

```javascript
// Lighting Diagram
canvasStore.addLightingDiagramCard({ x: 100, y: 100 })

// Camera Movement Diagram
canvasStore.addCameraMovementDiagramCard({ x: 100, y: 100 })
```

### Card Types
- **lighting-diagram**: For planning lighting setups
- **camera-movement**: For documenting camera movements

---

## Lighting Diagram Basics

### Step-by-Step: Creating Your First Lighting Setup

#### 1. Add a Subject
```
Click the "👤 Subject" button
→ A person icon appears in the center
→ Drag it to the desired position
```

#### 2. Add Lights
```
Select light type from dropdown (Key, Fill, Back, etc.)
→ Click "💡 Add Light"
→ Drag the light to position
→ Click on light to configure properties
```

#### 3. Configure Light Properties
When a light is selected, you can set:
- **Power**: e.g., "500W", "1000W"
- **Modifier**: e.g., "Softbox", "Umbrella", "Beauty Dish"
- **Color**: Click the color picker to select gel color
- **Angle**: Rotate the light direction

#### 4. Add Camera
```
Click "📷 Camera" button
→ Position the camera
→ Adjust rotation angle in properties panel
```

#### 5. Add Annotations
```
Click "📝 Note" button
→ Position the note
→ Edit text in properties panel
```

#### 6. Draw Custom Paths
```
Click "✏️ Draw" to toggle drawing mode
→ Draw freehand on canvas
→ Click "Drawing..." button again to save path
```

### Common Lighting Setups

#### Three-Point Lighting
```
1. Add Subject in center
2. Add Key Light (45° to left, slightly above)
3. Add Fill Light (45° to right, lower power)
4. Add Back Light (behind, elevated)
5. Add Camera (front, at subject height)
```

#### Rembrandt Lighting
```
1. Add Subject in center
2. Add Key Light (45° angle, high position)
3. Adjust until triangle of light appears on cheek
4. Optional: Add Fill Light (low power)
5. Add Camera (front)
```

---

## Camera Movement Diagram Basics

### Step-by-Step: Creating Your First Movement Diagram

#### 1. Select Movement Type
```
Choose from dropdown:
- Dolly (moving forward/backward)
- Pan (horizontal rotation)
- Tilt (vertical rotation)
- Crane (vertical movement)
- Steadicam (smooth fluid movement)
- Handheld (organic movement)
- Slider (linear movement on rails)
```

#### 2. Add Start and End Markers
```
Click "Start" button
→ Position green start marker
Click "End" button
→ Position red end marker
```

#### 3. Draw Movement Path
```
Select line style (Solid, Dashed, or Arrow)
→ Choose color and line width
→ Click "✏️ Draw Path" to enable drawing
→ Draw the camera movement path
→ Click again to save
```

#### 4. Add Annotations
```
Click "📝 Note" button
→ Position annotation at key points
→ Add descriptive text (e.g., "Focus on subject")
```

### Movement Examples

#### Simple Dolly In
```
1. Select "Dolly" movement type
2. Place Start marker at far position
3. Place End marker closer to subject
4. Draw straight arrow path from Start to End
5. Add annotation: "Slow push in, 5 seconds"
```

#### Crane Shot
```
1. Select "Crane" movement type
2. Place Start marker at ground level
3. Place End marker at elevated position
4. Draw upward curved path
5. Add annotations at key heights
```

#### Pan + Tilt Combination
```
1. Select "Pan" or "Tilt" as primary
2. Draw curved path showing rotation
3. Add multiple annotations for direction changes
4. Use different colored paths for different takes
```

---

## Common Workflows

### Workflow 1: Pre-Production Planning

**Use Case**: Planning a commercial shoot

1. **Create Lighting Diagram**
   - Add subject (product or person)
   - Position key, fill, and rim lights
   - Add background light
   - Position camera
   - Add notes for crew

2. **Create Camera Movement Diagram**
   - Document opening dolly shot
   - Show hero product reveal
   - Plan b-roll movements
   - Add timing annotations

### Workflow 2: Documentation

**Use Case**: Recording actual shoot setup for reference

1. **During Shoot**
   - Take photo of actual setup
   - Create lighting diagram matching reality
   - Note actual equipment used (power, modifiers)
   - Document camera positions and movements

2. **Post-Production Reference**
   - Use diagrams to recreate looks
   - Share with team for continuity
   - Archive for future projects

### Workflow 3: Client Presentation

**Use Case**: Presenting creative concept to client

1. **Create Visual Storyboard**
   - Multiple lighting diagrams for different scenes
   - Camera movement diagrams for key shots
   - Add detailed annotations explaining choices
   - Include technical specifications

2. **Export and Share**
   - Take screenshots of diagrams
   - Include in pitch deck
   - Share board link for collaboration

---

## Keyboard Shortcuts

### General
- `Esc` - Deselect item
- `Delete` / `Backspace` - Delete selected item
- `Arrow Keys` - Fine-tune position (when implemented)

### Lighting Diagram
- `L` - Toggle drawing mode (when implemented)
- `1-7` - Quick select light types (when implemented)
- `R` - Rotate selected item (when implemented)

### Camera Movement
- `D` - Toggle drawing mode (when implemented)
- `S` - Add start marker (when implemented)
- `E` - Add end marker (when implemented)

---

## Tips and Tricks

### Lighting Diagram Tips

#### Realistic Positioning
```
Real-world distances:
- Key light: 3-6 feet from subject
- Fill light: 5-8 feet from subject
- Back light: 4-6 feet behind subject
```

#### Color Coding
```
Use light colors to indicate gels:
- Orange (#FFA500): CTO (warm)
- Blue (#4A90E2): CTB (cool)
- Green (#10B981): Creative effect
```

#### Power Ratios
```
Standard ratios:
- Key:Fill = 2:1 (low contrast)
- Key:Fill = 4:1 (high contrast)
- Document actual wattage in power field
```

### Camera Movement Tips

#### Path Drawing
```
Best practices:
- Use solid lines for primary movement
- Use dashed lines for alternative takes
- Use arrows to show direction clearly
```

#### Timing Annotations
```
Add timing notes like:
- "0-3s: Slow dolly in"
- "3-5s: Hold position"
- "5-8s: Pan right 45°"
```

#### Multiple Angles
```
Create separate diagrams for:
- Master shot movements
- Close-up movements
- B-roll movements
- Each significant camera angle
```

### General Canvas Tips

#### Organization
```
- Use consistent positioning (camera at bottom)
- Group related elements together
- Keep annotations clear and concise
- Use colors to differentiate takes/versions
```

#### Performance
```
- Minimize number of drawing paths
- Clear unused items regularly
- Avoid extremely large canvases
```

#### Collaboration
```
- Add clear labels to all elements
- Include measurements when relevant
- Document any special equipment needs
- Add crew notes for setup instructions
```

---

## Troubleshooting

### Issue: Items won't drag
**Solution**: Click on the item first to select it, then drag

### Issue: Drawing mode won't turn off
**Solution**: Click the "Drawing..." button again, or click outside canvas

### Issue: Can't delete item
**Solution**: Select the item first, then click "Delete" in properties panel

### Issue: Canvas appears blank
**Solution**: Refresh the page, check if items were saved, verify canvas size

### Issue: Properties panel not showing
**Solution**: Click on an item to select it first

---

## Example Use Cases

### Example 1: Interview Setup
```
Subject: Person in center
Key Light: Softbox 45° left, 1000W
Fill Light: Umbrella 45° right, 500W
Back Light: Bare bulb behind, 750W
Camera: Front, eye level
Notes: "Warm practical lamp in background"
```

### Example 2: Product Photography
```
Subject: Product in center (product icon)
Key Light: Beauty dish top-left, 500W
Fill Light: White reflector right side
Background Light: Gradient backdrop, 2x 250W
Camera: Front, slightly elevated
Notes: "White seamless background"
```

### Example 3: Dolly Zoom Effect
```
Movement Type: Dolly
Start: Wide angle, close to subject
End: Telephoto, far from subject
Path: Straight line backward
Annotations:
- "Start: 24mm lens, 3ft from subject"
- "End: 85mm lens, 12ft from subject"
- "Pull focus throughout"
```

---

## Advanced Techniques

### Combining Multiple Diagrams

Create a series of diagrams on the same board:
1. Main lighting setup
2. Alternative lighting for different scenes
3. Camera movement sequence
4. Behind-the-scenes equipment layout

### Diagram as Production Document

Export diagrams to PDF for crew:
1. Screenshot each diagram
2. Compile into PDF with notes
3. Print for on-set reference
4. Share digitally with team

### Learning from Masters

Recreate famous lighting setups:
1. Find reference images
2. Recreate in lighting diagram
3. Analyze light positions and ratios
4. Practice and adapt for your projects

---

## Resources

### Related Documentation
- [Full Photography Canvas Components Documentation](photography-canvas-components.md)
- [Architecture Overview](architecture.md)
- [Board Management](board-management.md)

### External Learning Resources
- **Lighting**: YouTube tutorials on three-point lighting
- **Camera Movement**: Cinematography courses on camera techniques
- **Photography Theory**: Books on lighting and composition

---

## Getting Help

### Community Support
- GitHub Issues: Report bugs or request features
- Discord: Join the community for help and tips
- Documentation: Check full docs for detailed information

### Feature Requests
If you'd like to see additional features:
1. Check existing GitHub issues
2. Create new feature request
3. Describe your use case
4. Provide examples if possible

---

**Quick Reference Card**

```
LIGHTING DIAGRAM QUICK REFERENCE
================================
Add Elements:
- 💡 Light (select type first)
- 👤 Subject (one per diagram)
- 📷 Camera (one per diagram)
- 📝 Note (unlimited)
- ✏️ Draw (freehand paths)

Light Types:
- Key: Main light source
- Fill: Reduce shadows
- Back: Separate from background
- Rim: Edge lighting
- Hair: Highlight hair
- Background: Light background
- Practical: Visible in scene

Properties:
- Power: Wattage/intensity
- Modifier: Softbox, umbrella, etc.
- Color: Gel color
- Angle: Light direction
```

```
CAMERA MOVEMENT QUICK REFERENCE
================================
Movement Types:
- Dolly: Forward/backward
- Pan: Horizontal rotation
- Tilt: Vertical rotation
- Crane: Vertical movement
- Steadicam: Smooth fluid
- Handheld: Organic
- Slider: Linear rails

Path Styles:
- Solid: Standard line
- Dashed: Alternative path
- Arrow: Directional

Controls:
- Start: Green marker
- End: Red marker
- 📝 Note: Annotations
- ✏️ Draw: Draw paths
- Color: Path color
- Width: Line thickness
```

---

**Last Updated**: 2026-01-07
**Version**: 1.0.0
