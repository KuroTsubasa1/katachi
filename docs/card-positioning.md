# Card Positioning System

## Center Viewport Spawning

All new cards now spawn in the center of the user's current viewport, regardless of zoom level or pan position.

### Implementation

#### Core Method: `getCenterPosition`

Located in `stores/canvas.ts:247-301`, this method calculates the world-space position for a card to appear centered in the visible viewport.

**Algorithm:**

```typescript
// 1. Get viewport dimensions (screen space)
viewportWidth = containerSize.width or fallback to DOM/window
viewportHeight = containerSize.height or fallback to DOM/window

// 2. Find screen-space center
screenCenterX = viewportWidth / 2
screenCenterY = viewportHeight / 2

// 3. Convert screen coordinates to world coordinates
// Formula: worldCoord = (screenCoord - translate) / scale
worldCenterX = (screenCenterX - viewport.x) / viewport.scale
worldCenterY = (screenCenterY - viewport.y) / viewport.scale

// 4. Position card so its center aligns with viewport center
cardX = worldCenterX - cardWidth / 2
cardY = worldCenterY - cardHeight / 2
```

### Coordinate Systems

#### Screen Space
- Origin at top-left of the canvas container (after sidebar)
- Fixed to the browser window
- User sees this coordinate system

#### World Space
- Origin at (0, 0) in the infinite canvas
- Cards are positioned in world coordinates
- Transforms with pan and zoom

### CSS Transform

The canvas uses a CSS transform to convert world space to screen space:

```css
transform: translate(viewport.x, viewport.y) scale(viewport.scale)
```

This applies (in matrix multiplication order):
1. **Scale**: World positions are multiplied by scale factor
2. **Translate**: Scaled positions are offset by pan amount

**Conversion Formula:**
```
screenX = worldX * scale + translateX
screenY = worldY * scale + translateY
```

**Inverse (for positioning):**
```
worldX = (screenX - translateX) / scale
worldY = (screenY - translateY) / scale
```

## Viewport Dimensions

The system determines viewport dimensions in this priority order:

1. **ResizeObserver** (`containerSize`): Set by `CanvasBoard.vue` when canvas resizes
2. **DOM Query**: Directly measures `.canvas-grid` element via `getBoundingClientRect()`
3. **Window Fallback**: `window.innerWidth - 256` (accounting for sidebar width)
4. **SSR Fallback**: Default to 1000x800

### Why This Order?

- **ResizeObserver** is most accurate once initialized
- **DOM Query** works immediately when element is mounted
- **Window Fallback** ensures cards spawn reasonably even before mount
- **SSR Fallback** prevents errors during server-side rendering

## Card Types Covered

All card creation methods use `getCenterPosition`:

| Card Type | Created Via | Uses Center Position |
|-----------|-------------|---------------------|
| Text Note | `addCard()` | ✅ Yes |
| Rich Text | `addCard()` | ✅ Yes |
| Column | `addColumnCard()` | ✅ Yes |
| Drawing | `addDrawingCard()` | ✅ Yes |
| Storyboard | `addStoryboardCard()` | ✅ Yes |
| Image | `addImageCard()` | ✅ Yes |
| Link | `addCard()` | ✅ Yes |
| Table | `addCard()` | ✅ Yes |
| Audio | `addCard()` | ✅ Yes |
| Video | `addCard()` | ✅ Yes |
| Map | `addCard()` | ✅ Yes |
| Markdown | `addCard()` | ✅ Yes |
| Todo List | `addCard()` | ✅ Yes |

### Paste Operation

Keyboard shortcut (Cmd/Ctrl+V) also uses `getCenterPosition`:

```typescript
// composables/useKeyboardShortcuts.ts:72-79
if (hasModifier && e.key === 'v') {
  const position = canvasStore.getCenterPosition({ width: 0, height: 0 })
  canvasStore.pasteCard(position)
}
```

## User Experience

### Default Viewport (No Pan/Zoom)
- Viewport at (0, 0), scale 1.0
- Cards spawn at approximately:
  - x: `(window.innerWidth - 256) / 2 - cardWidth / 2`
  - y: `window.innerHeight / 2 - cardHeight / 2`
- Result: Card appears in center of visible canvas

### Panned Viewport
- User has panned canvas (e.g., viewport at (500, 300))
- Card spawns at the center of the VISIBLE area
- Not at (0, 0) in world space
- Follows the user's current view

### Zoomed Viewport
- User has zoomed in (e.g., scale 2.0)
- Card spawns at the center of the VISIBLE area
- World coordinates account for zoom level
- Card size is correct relative to zoom

### Combined Pan + Zoom
- Viewport at any (x, y) with any scale
- Algorithm correctly converts screen center to world position
- Card always appears centered in user's view

## Edge Cases Handled

### Negative World Coordinates
- Removed `Math.max(0, ...)` clamping
- Cards can spawn at negative world coordinates
- Allows center positioning when viewport shows negative space
- Example: User panned right, center is now at (-200, 100) in world space

### Container Not Ready
- Fallback to DOM query
- Then fallback to window dimensions
- Ensures positioning works even on first card

### Sidebar Width
- Accounts for 256px sidebar on desktop
- Uses actual canvas container dimensions when available
- Mobile layout adjusts automatically (sidebar overlays)

## Testing

To verify center positioning:

1. **Default State**: Add a card - should appear in center
2. **Pan Test**: Pan canvas, add card - should appear in center of view
3. **Zoom Test**: Zoom in/out, add card - should appear in center of view
4. **Combined**: Pan + zoom, add card - should appear in center of view

### Debug Logs

The system logs detailed positioning info to console:

```javascript
[CanvasStore] getCenterPosition: {
  viewport: { width: 1664, height: 1080 },
  pan: { x: 0, y: 0 },
  scale: 1,
  cardSize: { width: 200, height: 150 },
  screenCenter: { x: 832, y: 540 },
  worldCenter: { x: 832, y: 540 },
  cardPosition: { x: 732, y: 465 }
}
```

## Files Modified

1. **`stores/canvas.ts`**
   - Enhanced `getCenterPosition()` method (lines 247-301)
   - Improved viewport dimension detection
   - Removed negative coordinate clamping
   - Added comprehensive logging

2. **`composables/useKeyboardShortcuts.ts`**
   - Updated paste command to use `getCenterPosition()` (lines 72-79)
   - Ensures consistency with other card creation methods

3. **`pages/index.vue`**
   - Already correctly calling `getCenterPosition(size)` for all card types
   - No changes needed (implementation was already correct)

## Future Improvements

Potential enhancements:

- **Smart Positioning**: Avoid overlapping existing cards
- **Clustered Spawning**: Multiple cards in quick succession spawn in a pattern
- **Spawn Animation**: Visual feedback showing card appearing from center
- **Position History**: Remember last manual card position for context

## Troubleshooting

### Cards Not Centering

1. **Clear browser cache**: Old JavaScript may be cached
2. **Check console logs**: Look for `[CanvasStore] getCenterPosition` output
3. **Verify ResizeObserver**: Should log container dimensions on mount
4. **Test with reset viewport**: Press Cmd/Ctrl+0 to reset view, then add card

### Cards Spawn at (0, 0)

- This should no longer happen with the fixes
- If it does, check if `getCenterPosition` is being called
- Verify the console logs show correct calculations

### Cards Spawn Off-Screen

- Check if viewport has extreme pan values
- Verify `containerSize` is being set correctly
- May indicate a CSS transform issue

---

**Last Updated**: January 2026
**Related**: Canvas coordinate system, viewport management
