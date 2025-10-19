# Mobile Touch Support Implementation Plan

**Version:** 1.0.0
**Date:** 2025-10-18
**Status:** Planning

## Executive Summary

This document outlines a tiered implementation strategy to enable mobile touch support for the canvas-based application. Currently, the application is 100% mouse-driven with no touch event handlers. The plan prioritizes desktop functionality (99% of use cases) while adding progressive mobile support.

## Current State Analysis

### Implementation Location
- **Primary File:** `my-react-app/src/DemoFigma.tsx:102-1122`
- **Current State:** Mouse-only interaction (mousedown, mousemove, mouseup)
- **Touch Support:** None (no touch event handlers exist)

### Existing Interaction Patterns
1. **Canvas Panning:** Left/middle mouse drag (`DemoFigma.tsx:825-987`)
2. **Zoom:** Scroll wheel with point-under-cursor preservation (`DemoFigma.tsx:736-771`)
3. **Shape Manipulation:** Click-drag for move, handles for resize (`DemoFigma.tsx:989-1122`)
4. **Coordinate Transform:** Screen → Canvas space via `(mouseX - pan.x) / zoom`

### Critical Dependencies
- Mapbox GL integration (`mapRef.current.panBy()`)
- React state: `zoom`, `pan`, `isPanning`, `draggingShape`, `resizingState`
- Grid overlay system (CSS variables: `--pan-x`, `--pan-y`, `--grid-size`)

---

## Design Principles

1. **Desktop First:** Ensure zero regression for mouse/desktop workflows
2. **Progressive Enhancement:** Touch support adds functionality without breaking existing features
3. **Minimal Overhead:** Keep touch code separate to avoid performance impact on desktop
4. **Feature Parity:** Mobile should eventually support all desktop interactions
5. **Graceful Degradation:** Basic pan/zoom before advanced shape manipulation

---

## Tier 1: Basic Mobile Panning (MVP)

**Goal:** Enable mobile users to pan around the canvas with single-finger drag
**Effort:** ~4 hours
**Risk:** Low (isolated touch handlers)

### Features
- ✅ Single-finger touch drag for canvas panning
- ✅ Coordinate transformation compatibility with existing system
- ✅ Prevent default browser behaviors (pull-to-refresh, pinch-zoom)
- ✅ Touch feedback (optional: visual indicator)

### Implementation Checklist

#### 1.1 Add Touch State Management
**Location:** `DemoFigma.tsx:102-110` (near existing state)

```typescript
// Add after line 110
const [isTouching, setIsTouching] = useState(false);
const lastTouchPosition = useRef<{ x: number; y: number } | null>(null);
const activeTouchId = useRef<number | null>(null);
```

#### 1.2 Create Touch Event Handlers
**Location:** `DemoFigma.tsx:988` (after `handleMouseUp`)

```typescript
// Add touch handlers
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  // Only handle single touch for panning
  if (e.touches.length !== 1) return;
  if (activeTool) return; // Don't pan if drawing tool active

  const touch = e.touches[0];
  activeTouchId.current = touch.identifier;
  lastTouchPosition.current = { x: touch.clientX, y: touch.clientY };
  setIsTouching(true);
  dragHappened.current = false;

  // Prevent default to stop scrolling
  e.preventDefault();
}, [activeTool]);

const handleTouchMove = useCallback((e: React.TouchEvent) => {
  if (!isTouching || activeTouchId.current === null) return;

  // Find the active touch
  const touch = Array.from(e.touches).find(t => t.identifier === activeTouchId.current);
  if (!touch || !lastTouchPosition.current) return;

  dragHappened.current = true;
  const dx = touch.clientX - lastTouchPosition.current.x;
  const dy = touch.clientY - lastTouchPosition.current.y;
  lastTouchPosition.current = { x: touch.clientX, y: touch.clientY };

  // Sync with mapbox
  if (mapRef.current) {
    mapRef.current.panBy([-dx, -dy], { duration: 0 });
  }

  // Update canvas pan
  setPan(prevPan => ({
    x: prevPan.x + dx,
    y: prevPan.y + dy
  }));

  e.preventDefault();
}, [isTouching, mapRef]);

const handleTouchEnd = useCallback((e: React.TouchEvent) => {
  // Check if our tracked touch ended
  const endedTouch = Array.from(e.changedTouches).find(
    t => t.identifier === activeTouchId.current
  );

  if (endedTouch) {
    setIsTouching(false);
    lastTouchPosition.current = null;
    activeTouchId.current = null;
  }
}, []);
```

#### 1.3 Wire Up Touch Listeners
**Location:** `DemoFigma.tsx:1446-1461` (canvas container)

```typescript
// Modify the canvas div to include touch handlers
<div
  ref={canvasRef}
  className={`canvas-container ${activeTool ? 'shape-creation-mode' : ''}`}
  style={{...}}
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseUp}
  onClick={handleCanvasClick}
  onContextMenu={(e) => e.preventDefault()}
  // ADD THESE:
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  onTouchCancel={handleTouchEnd}
/>
```

#### 1.4 Add CSS for Touch Improvements
**Location:** `DemoFigma.css`

```css
/* Prevent default touch behaviors on canvas */
.canvas-container {
  touch-action: none; /* Disable browser pan/zoom */
  -webkit-user-select: none; /* Prevent text selection on touch */
  user-select: none;
}

/* Optional: Touch feedback indicator */
.canvas-container.touching {
  cursor: grabbing;
}
```

#### 1.5 Update Canvas Container Class
**Location:** `DemoFigma.tsx:1446`

```typescript
className={`canvas-container ${activeTool ? 'shape-creation-mode' : ''} ${isTouching ? 'touching' : ''}`}
```

### Testing Checklist
- [ ] Single-finger drag pans the canvas smoothly on mobile
- [ ] Desktop mouse panning still works identically
- [ ] No accidental browser zoom/scroll during touch pan
- [ ] Mapbox map stays synchronized with canvas pan
- [ ] Touch panning disabled when drawing tool active
- [ ] Multi-touch doesn't trigger panning (reserved for Tier 2)

### Success Metrics
- Mobile users can navigate the full canvas area
- Zero regressions in desktop mouse behavior
- Touch responsiveness feels native (<16ms response time)

---

## Tier 2: Pinch-to-Zoom Support

**Goal:** Enable two-finger pinch gesture for intuitive mobile zooming
**Effort:** ~6 hours
**Risk:** Medium (coordinate math complexity, zoom conflicts)

### Features
- ✅ Two-finger pinch to zoom in/out
- ✅ Zoom centers on midpoint between fingers
- ✅ Smooth zoom animation
- ✅ Coordinate transformation maintains point-under-touch
- ✅ Min/max zoom limits respected

### Implementation Checklist

#### 2.1 Add Pinch State Management
**Location:** `DemoFigma.tsx:110` (with Tier 1 touch state)

```typescript
const [isPinching, setIsPinching] = useState(false);
const initialPinchDistance = useRef<number | null>(null);
const pinchStartZoom = useRef<number>(1);
const pinchCenter = useRef<{ x: number; y: number } | null>(null);
```

#### 2.2 Create Pinch Gesture Detector
**Location:** `DemoFigma.tsx:988` (new utility function)

```typescript
const getPinchDistance = (touch1: React.Touch, touch2: React.Touch): number => {
  return Math.hypot(
    touch2.clientX - touch1.clientX,
    touch2.clientY - touch1.clientY
  );
};

const getPinchCenter = (touch1: React.Touch, touch2: React.Touch) => {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  };
};
```

#### 2.3 Update Touch Handlers
**Location:** Modify `handleTouchStart`, `handleTouchMove`, `handleTouchEnd` from Tier 1

```typescript
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  // Two-finger pinch
  if (e.touches.length === 2) {
    const [touch1, touch2] = Array.from(e.touches);
    initialPinchDistance.current = getPinchDistance(touch1, touch2);
    pinchStartZoom.current = zoom;
    pinchCenter.current = getPinchCenter(touch1, touch2);
    setIsPinching(true);
    setIsTouching(false); // Stop panning
    e.preventDefault();
    return;
  }

  // Single-finger pan (existing Tier 1 code)
  if (e.touches.length === 1 && !activeTool) {
    // ... existing single-touch logic
  }
}, [activeTool, zoom]);

const handleTouchMove = useCallback((e: React.TouchEvent) => {
  // Handle pinch zoom
  if (isPinching && e.touches.length === 2) {
    const [touch1, touch2] = Array.from(e.touches);
    const currentDistance = getPinchDistance(touch1, touch2);
    const currentCenter = getPinchCenter(touch1, touch2);

    if (!initialPinchDistance.current || !pinchCenter.current) return;

    // Calculate zoom scale
    const scale = currentDistance / initialPinchDistance.current;
    const newZoom = Math.max(0.1, Math.min(10, pinchStartZoom.current * scale));

    // Get canvas rect for coordinate conversion
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate zoom center in canvas space
    const centerX = currentCenter.x - rect.left;
    const centerY = currentCenter.y - rect.top;
    const pointX = (centerX - pan.x) / zoom;
    const pointY = (centerY - pan.y) / zoom;

    // Adjust pan to keep point under center
    const newPanX = centerX - pointX * newZoom;
    const newPanY = centerY - pointY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });

    // Sync with mapbox
    if (mapRef.current) {
      const mapZoom = Math.log2(newZoom) + 12; // Adjust base zoom
      mapRef.current.setZoom(mapZoom);
    }

    e.preventDefault();
    return;
  }

  // Handle single-finger pan (existing Tier 1 code)
  if (isTouching && e.touches.length === 1) {
    // ... existing pan logic
  }
}, [isPinching, isTouching, zoom, pan, mapRef]);

const handleTouchEnd = useCallback((e: React.TouchEvent) => {
  // Reset pinch if fingers lifted
  if (e.touches.length < 2) {
    setIsPinching(false);
    initialPinchDistance.current = null;
    pinchCenter.current = null;
  }

  // Reset pan if no touches remain
  if (e.touches.length === 0) {
    setIsTouching(false);
    lastTouchPosition.current = null;
    activeTouchId.current = null;
  }
}, []);
```

#### 2.4 Add Visual Feedback (Optional)
**Location:** `DemoFigma.css`

```css
.canvas-container.pinching {
  cursor: zoom-in;
}
```

**Location:** `DemoFigma.tsx:1446` (update className)

```typescript
className={`canvas-container ${activeTool ? 'shape-creation-mode' : ''} ${isTouching ? 'touching' : ''} ${isPinching ? 'pinching' : ''}`}
```

### Testing Checklist
- [ ] Two-finger pinch smoothly zooms in/out
- [ ] Zoom centers on midpoint between fingers
- [ ] Single-finger pan still works after pinch ends
- [ ] Desktop scroll-wheel zoom unaffected
- [ ] Zoom limits (0.1x - 10x) respected
- [ ] Mapbox zoom stays synchronized
- [ ] No jitter or jumps during pinch gesture
- [ ] Grid overlay scales correctly with pinch zoom

### Success Metrics
- Pinch zoom feels native and responsive
- Zoom transformation is mathematically precise
- Zero desktop regression

---

## Tier 3: Touch-Based Shape Manipulation

**Goal:** Enable shape selection, dragging, and resizing on mobile
**Effort:** ~8 hours
**Risk:** Medium-High (complex interaction states, conflict with pan)

### Features
- ✅ Tap to select shapes
- ✅ Long-press to enter shape drag mode
- ✅ Drag selected shapes with single touch
- ✅ Resize handles work with touch
- ✅ Double-tap to enter edit mode
- ✅ Visual feedback for touch targets

### Implementation Challenges
1. **Conflict Resolution:** Distinguish between canvas pan and shape drag
2. **Touch Targets:** Resize handles need larger hit areas on mobile
3. **Hover States:** No hover on touch (need alternative visual feedback)
4. **Long Press Detection:** Implement timeout-based gesture recognition

### Implementation Checklist

#### 3.1 Add Touch-Specific Shape State
**Location:** `DemoFigma.tsx:110`

```typescript
const [touchDraggingShape, setTouchDraggingShape] = useState<{
  id: string;
  startX: number;
  startY: number;
  touchStartX: number;
  touchStartY: number;
} | null>(null);

const longPressTimer = useRef<NodeJS.Timeout | null>(null);
const tapStartTime = useRef<number>(0);
const doubleTapTimer = useRef<NodeJS.Timeout | null>(null);
```

#### 3.2 Create Touch Target Detection
**Location:** `DemoFigma.tsx:988` (new utility)

```typescript
const getTouchTarget = (touch: React.Touch): { type: 'shape' | 'handle' | 'canvas', id?: string, handle?: string } => {
  const rect = canvasRef.current?.getBoundingClientRect();
  if (!rect) return { type: 'canvas' };

  const touchX = touch.clientX - rect.left;
  const touchY = touch.clientY - rect.top;
  const canvasX = (touchX - pan.x) / zoom;
  const canvasY = (touchY - pan.y) / zoom;

  // Check resize handles first (higher priority)
  for (const shape of shapes) {
    if (shape.id === selectedShapeId) {
      const handles = getResizeHandles(shape);
      const touchRadius = 20 / zoom; // Larger hit area for touch

      for (const [handleName, handlePos] of Object.entries(handles)) {
        const distance = Math.hypot(canvasX - handlePos.x, canvasY - handlePos.y);
        if (distance < touchRadius) {
          return { type: 'handle', id: shape.id, handle: handleName };
        }
      }
    }
  }

  // Check if touch is on a shape
  for (const shape of shapes) {
    if (isPointInShape(canvasX, canvasY, shape)) {
      return { type: 'shape', id: shape.id };
    }
  }

  return { type: 'canvas' };
};
```

#### 3.3 Implement Long Press for Shape Drag
**Location:** Modify `handleTouchStart` from Tier 2

```typescript
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  // Two-finger pinch (Tier 2 logic)
  if (e.touches.length === 2) {
    // ... existing pinch logic
    return;
  }

  // Single-finger touch
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const target = getTouchTarget(touch);
    tapStartTime.current = Date.now();

    // Handle touch on resize handle
    if (target.type === 'handle' && target.id && target.handle) {
      // Similar to handleResizeMouseDown (line 548)
      const shape = shapes.find(s => s.id === target.id);
      if (!shape) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;

      setResizingState({
        id: shape.id,
        handle: target.handle,
        startX: shape.x,
        startY: shape.y,
        startWidth: shape.width,
        startHeight: shape.height,
        mouseStartX: touchX,
        mouseStartY: touchY
      });

      e.preventDefault();
      return;
    }

    // Handle touch on shape - long press to drag
    if (target.type === 'shape' && target.id) {
      // Select shape immediately
      setSelectedShapeId(target.id);

      // Start long press timer for dragging
      longPressTimer.current = setTimeout(() => {
        const shape = shapes.find(s => s.id === target.id);
        if (!shape) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        const canvasX = (touchX - pan.x) / zoom;
        const canvasY = (touchY - pan.y) / zoom;

        setTouchDraggingShape({
          id: shape.id,
          startX: shape.x,
          startY: shape.y,
          touchStartX: canvasX,
          touchStartY: canvasY
        });

        // Haptic feedback (if available)
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, 500); // 500ms long press threshold

      e.preventDefault();
      return;
    }

    // Touch on canvas - pan (Tier 1 logic)
    if (target.type === 'canvas' && !activeTool) {
      // ... existing pan logic
    }
  }
}, [shapes, selectedShapeId, activeTool, pan, zoom, setSelectedShapeId]);
```

#### 3.4 Handle Touch Move for Shapes
**Location:** Modify `handleTouchMove` from Tier 2

```typescript
const handleTouchMove = useCallback((e: React.TouchEvent) => {
  // Pinch zoom (Tier 2)
  if (isPinching && e.touches.length === 2) {
    // ... existing pinch logic
    return;
  }

  // Single touch
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    const canvasX = (touchX - pan.x) / zoom;
    const canvasY = (touchY - pan.y) / zoom;

    // Cancel long press if finger moves (indicates pan intent)
    if (longPressTimer.current && !touchDraggingShape) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Handle shape resize
    if (resizingState) {
      // Similar to handleMouseMove resize logic (line 840-920)
      const dx = touchX - resizingState.mouseStartX;
      const dy = touchY - resizingState.mouseStartY;
      const dxCanvas = dx / zoom;
      const dyCanvas = dy / zoom;

      // ... apply resize based on handle
      // (reuse existing resize logic from mouse handler)

      e.preventDefault();
      return;
    }

    // Handle shape drag
    if (touchDraggingShape) {
      const shape = shapes.find(s => s.id === touchDraggingShape.id);
      if (!shape) return;

      const deltaX = canvasX - touchDraggingShape.touchStartX;
      const deltaY = canvasY - touchDraggingShape.touchStartY;

      const newX = touchDraggingShape.startX + deltaX;
      const newY = touchDraggingShape.startY + deltaY;

      setShapes(prevShapes =>
        prevShapes.map(s =>
          s.id === shape.id
            ? { ...s, x: newX, y: newY }
            : s
        )
      );

      e.preventDefault();
      return;
    }

    // Canvas pan (Tier 1)
    if (isTouching) {
      // ... existing pan logic
    }
  }
}, [isPinching, isTouching, touchDraggingShape, resizingState, shapes, pan, zoom]);
```

#### 3.5 Handle Touch End
**Location:** Modify `handleTouchEnd` from Tier 2

```typescript
const handleTouchEnd = useCallback((e: React.TouchEvent) => {
  // Clear long press timer
  if (longPressTimer.current) {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  }

  // Detect tap vs drag
  const touchDuration = Date.now() - tapStartTime.current;
  const wasTap = touchDuration < 300 && !dragHappened.current;

  // Handle double-tap (edit mode)
  if (wasTap && selectedShapeId) {
    if (doubleTapTimer.current) {
      // Second tap - enter edit mode
      clearTimeout(doubleTapTimer.current);
      doubleTapTimer.current = null;
      // TODO: Enter text edit mode for selected shape
      console.log('Double tap - enter edit mode');
    } else {
      // First tap - wait for second
      doubleTapTimer.current = setTimeout(() => {
        doubleTapTimer.current = null;
      }, 300);
    }
  }

  // Save shape changes if dragged or resized
  if (touchDraggingShape || resizingState) {
    const shapeId = touchDraggingShape?.id || resizingState?.id;
    if (shapeId) {
      const shape = shapes.find(s => s.id === shapeId);
      if (shape) {
        // Persist to backend
        fetch(`/api/shapes/${shapeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shape)
        });
      }
    }

    setTouchDraggingShape(null);
    setResizingState(null);
  }

  // Tier 2 pinch reset
  if (e.touches.length < 2) {
    setIsPinching(false);
    initialPinchDistance.current = null;
  }

  // Tier 1 pan reset
  if (e.touches.length === 0) {
    setIsTouching(false);
    lastTouchPosition.current = null;
    activeTouchId.current = null;
    dragHappened.current = false;
  }
}, [touchDraggingShape, resizingState, selectedShapeId, shapes]);
```

#### 3.6 Increase Touch Target Sizes
**Location:** `DemoFigma.css`

```css
/* Larger resize handles on touch devices */
@media (pointer: coarse) {
  .resize-handle {
    width: 16px;
    height: 16px;
    border: 2px solid #0066ff;
  }

  .shape {
    /* Slightly thicker borders for visibility */
    border-width: 2px;
  }
}
```

#### 3.7 Add Mobile-Specific Visual Feedback
**Location:** `DemoFigma.css`

```css
/* Touch feedback */
.shape.touch-dragging {
  opacity: 0.7;
  transform: scale(1.05);
  transition: transform 0.1s ease;
}

.canvas-container.long-pressing {
  cursor: grabbing;
}
```

### Testing Checklist
- [ ] Tap selects shapes without panning
- [ ] Long-press (500ms) enables shape dragging
- [ ] Dragged shapes follow finger smoothly
- [ ] Resize handles respond to touch
- [ ] Double-tap enters edit mode (if implemented)
- [ ] Larger touch targets work correctly
- [ ] No interference with canvas pan
- [ ] No interference with pinch zoom
- [ ] Desktop mouse interactions unchanged
- [ ] Shape changes persist to backend

### Success Metrics
- Mobile users can fully manipulate shapes
- Long-press gesture feels natural
- Touch targets are 44x44px minimum (accessibility)
- Zero desktop regression

---

## Tier 4: Advanced Mobile UX Enhancements

**Goal:** Optimize mobile experience with native-feeling gestures and UI adaptations
**Effort:** ~12 hours
**Risk:** Medium (UI/UX complexity, cross-device testing)

### Features
- ✅ Momentum scrolling (inertia after pan)
- ✅ Smooth zoom animation
- ✅ Mobile-optimized toolbar (collapsible, bottom sheet)
- ✅ Context menus via long-press on shapes
- ✅ Touch-friendly color picker
- ✅ Gesture hints for first-time users
- ✅ Prevent accidental toolbar taps during pan
- ✅ Landscape/portrait responsive layouts

### Implementation Areas

#### 4.1 Momentum Scrolling
**Location:** `DemoFigma.tsx` (new utility)

```typescript
const [panVelocity, setPanVelocity] = useState({ x: 0, y: 0 });
const momentumAnimation = useRef<number | null>(null);

const applyMomentum = useCallback(() => {
  setPan(prevPan => ({
    x: prevPan.x + panVelocity.x,
    y: prevPan.y + panVelocity.y
  }));

  // Decay velocity
  setPanVelocity(prevVel => ({
    x: prevVel.x * 0.95,
    y: prevVel.y * 0.95
  }));

  // Stop if velocity is negligible
  if (Math.abs(panVelocity.x) < 0.1 && Math.abs(panVelocity.y) < 0.1) {
    if (momentumAnimation.current) {
      cancelAnimationFrame(momentumAnimation.current);
      momentumAnimation.current = null;
    }
    setPanVelocity({ x: 0, y: 0 });
  } else {
    momentumAnimation.current = requestAnimationFrame(applyMomentum);
  }
}, [panVelocity]);

// In handleTouchMove, track velocity
const velocity = {
  x: dx / (Date.now() - lastTimestamp.current),
  y: dy / (Date.now() - lastTimestamp.current)
};

// In handleTouchEnd, start momentum
if (velocity.x !== 0 || velocity.y !== 0) {
  setPanVelocity(velocity);
  momentumAnimation.current = requestAnimationFrame(applyMomentum);
}
```

#### 4.2 Mobile Toolbar Adaptation
**Location:** New component `MobileToolbar.tsx`

```typescript
// Bottom sheet toolbar for mobile
export const MobileToolbar: React.FC<{
  activeTool: string | null;
  onToolSelect: (tool: string) => void;
  onColorChange: (color: string) => void;
}> = ({ activeTool, onToolSelect, onColorChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`mobile-toolbar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? '▼' : '▲'} Tools
      </button>

      {isExpanded && (
        <div className="tool-grid">
          {/* Touch-friendly tool buttons */}
        </div>
      )}
    </div>
  );
};
```

**Location:** `DemoFigma.css`

```css
@media (max-width: 768px) {
  .mobile-toolbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #ddd;
    padding: 12px;
    transition: transform 0.3s ease;
  }

  .mobile-toolbar.collapsed {
    transform: translateY(calc(100% - 60px));
  }

  .tool-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    gap: 12px;
  }

  .tool-button {
    min-height: 60px;
    min-width: 60px;
    touch-action: manipulation;
  }
}
```

#### 4.3 Context Menu via Long Press
**Location:** Modify Tier 3 long press handler

```typescript
// Show context menu instead of immediate drag
longPressTimer.current = setTimeout(() => {
  setContextMenu({
    x: touch.clientX,
    y: touch.clientY,
    shapeId: target.id,
    options: ['Copy', 'Delete', 'Duplicate', 'Bring to Front', 'Send to Back']
  });

  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}, 500);
```

#### 4.4 Gesture Hints Overlay
**Location:** New component `GestureHints.tsx`

```typescript
export const GestureHints: React.FC = () => {
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('gestureHintsDismissed') === 'true'
  );

  if (dismissed) return null;

  return (
    <div className="gesture-hints-overlay">
      <div className="hint-card">
        <h3>Mobile Gestures</h3>
        <ul>
          <li>🖐️ One finger: Pan canvas</li>
          <li>🤏 Two fingers: Pinch to zoom</li>
          <li>👆 Tap: Select shape</li>
          <li>👆👆 Double-tap: Edit text</li>
          <li>⏱️ Long press: Drag or context menu</li>
        </ul>
        <button onClick={() => {
          setDismissed(true);
          localStorage.setItem('gestureHintsDismissed', 'true');
        }}>
          Got it!
        </button>
      </div>
    </div>
  );
};
```

#### 4.5 Responsive Layout Adaptations
**Location:** `DemoFigma.css`

```css
/* Portrait mode - stack panels */
@media (max-width: 768px) and (orientation: portrait) {
  .sidebar {
    position: fixed;
    top: 0;
    left: -280px;
    height: 100vh;
    transition: left 0.3s ease;
    z-index: 100;
  }

  .sidebar.open {
    left: 0;
  }

  .canvas-container {
    width: 100vw;
    height: calc(100vh - 60px); /* Account for bottom toolbar */
  }
}

/* Landscape mode - optimize horizontal space */
@media (max-width: 1024px) and (orientation: landscape) {
  .toolbar {
    flex-direction: column;
    width: 60px;
  }

  .properties-panel {
    width: 200px;
  }
}
```

### Testing Checklist
- [ ] Momentum scrolling feels natural (not too fast/slow)
- [ ] Bottom toolbar doesn't interfere with canvas interactions
- [ ] Context menus appear on long-press
- [ ] Gesture hints shown on first mobile visit
- [ ] Layout adapts smoothly to portrait/landscape
- [ ] All touch targets meet 44x44px minimum
- [ ] Performance remains smooth (60fps pan/zoom)
- [ ] Desktop experience unchanged

### Success Metrics
- Mobile UX feels native and polished
- First-time users understand gestures
- Layout works on various device sizes
- Performance metrics: <16ms frame time

---

## Tier 5: Accessibility & Edge Cases

**Goal:** Ensure mobile support is robust, accessible, and handles edge cases gracefully
**Effort:** ~6 hours
**Risk:** Low (quality improvements)

### Features
- ✅ Screen reader support for mobile
- ✅ High contrast mode for low vision
- ✅ Reduced motion mode (disable animations)
- ✅ Handle touch interruptions (phone calls, notifications)
- ✅ Prevent data loss on orientation change
- ✅ Handle stylus/Apple Pencil input
- ✅ Support for foldable devices
- ✅ Graceful degradation for old browsers

### Implementation Areas

#### 5.1 Accessibility Enhancements
**Location:** `DemoFigma.tsx:1446` (canvas container)

```typescript
<div
  ref={canvasRef}
  className="canvas-container"
  role="application"
  aria-label="Design canvas - use touch gestures to pan and zoom"
  aria-live="polite"
  aria-describedby="gesture-instructions"
  tabIndex={0}
  // ... existing handlers
/>

<div id="gesture-instructions" className="sr-only">
  Use one finger to pan, two fingers to pinch zoom. Tap shapes to select,
  long press to drag. Double tap to edit.
</div>
```

**Location:** `DemoFigma.css`

```css
/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .shape {
    border-width: 3px;
  }

  .resize-handle {
    border-width: 3px;
    background: white;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .canvas-container,
  .shape,
  .toolbar,
  .mobile-toolbar {
    transition: none !important;
    animation: none !important;
  }
}
```

#### 5.2 Touch Interruption Handling
**Location:** `DemoFigma.tsx` (new effect)

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Page hidden (phone call, app switch, etc.)
      // Save current state
      if (touchDraggingShape || resizingState) {
        const shapeId = touchDraggingShape?.id || resizingState?.id;
        if (shapeId) {
          const shape = shapes.find(s => s.id === shapeId);
          if (shape) {
            fetch(`/api/shapes/${shapeId}`, {
              method: 'PUT',
              body: JSON.stringify(shape)
            });
          }
        }
      }

      // Reset touch states
      setTouchDraggingShape(null);
      setResizingState(null);
      setIsTouching(false);
      setIsPinching(false);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [touchDraggingShape, resizingState, shapes]);
```

#### 5.3 Stylus/Apple Pencil Support
**Location:** Modify touch handlers to detect stylus

```typescript
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  const touch = e.touches[0];

  // Detect stylus input
  const isStylus = (touch as any).touchType === 'stylus' ||
                   e.nativeEvent.pointerType === 'pen';

  if (isStylus) {
    // Treat stylus like precise mouse input
    // Allow immediate drawing without long-press
    // Use pressure sensitivity if available
    const pressure = (touch as any).force || 1.0;
    // ... handle stylus-specific behavior
  }

  // ... rest of touch handling
}, []);
```

#### 5.4 Orientation Change Handling
**Location:** `DemoFigma.tsx` (new effect)

```typescript
useEffect(() => {
  const handleOrientationChange = () => {
    // Recalculate canvas dimensions
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Adjust pan to keep content visible
    // (Implementation depends on desired behavior)

    // Force re-render of shapes
    setShapes(prevShapes => [...prevShapes]);
  };

  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);

  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleOrientationChange);
  };
}, []);
```

#### 5.5 Foldable Device Support
**Location:** `DemoFigma.tsx` (new effect)

```typescript
useEffect(() => {
  // Detect foldable device and fold state
  if ('screen' in window && 'orientation' in window.screen) {
    const screenOrientation = (window.screen.orientation as any);

    if (screenOrientation.type?.includes('fold')) {
      console.log('Foldable device detected');
      // Adjust layout for folded state
    }
  }

  // Listen for viewport segments (dual-screen API)
  if ('getWindowSegments' in window.visualViewport || false) {
    const segments = (window.visualViewport as any).getWindowSegments?.();
    if (segments && segments.length > 1) {
      console.log('Multi-segment display detected');
      // Layout for dual-screen
    }
  }
}, []);
```

#### 5.6 Browser Compatibility Fallbacks
**Location:** `DemoFigma.tsx` (feature detection)

```typescript
useEffect(() => {
  // Check touch support
  const hasTouch = 'ontouchstart' in window ||
                   navigator.maxTouchPoints > 0 ||
                   (navigator as any).msMaxTouchPoints > 0;

  if (!hasTouch) {
    console.log('Touch not supported - using mouse only');
    return;
  }

  // Check for passive event listener support
  let passiveSupported = false;
  try {
    const options = {
      get passive() {
        passiveSupported = true;
        return false;
      }
    };
    window.addEventListener('test', null as any, options);
    window.removeEventListener('test', null as any, options);
  } catch (err) {
    passiveSupported = false;
  }

  // Use appropriate listener options
  const listenerOptions = passiveSupported ? { passive: false } : false;

  // ... setup touch listeners with correct options
}, []);
```

### Testing Checklist
- [ ] Screen readers announce canvas state changes
- [ ] High contrast mode renders clearly
- [ ] Reduced motion respected
- [ ] Phone calls don't cause data loss
- [ ] Orientation change preserves canvas state
- [ ] Stylus input works for precise drawing
- [ ] Layout adapts on foldable devices
- [ ] Graceful fallback on older browsers
- [ ] ARIA labels correctly describe interactions

### Success Metrics
- WCAG 2.1 Level AA compliance
- Zero data loss from interruptions
- Support for 95% of mobile browsers
- Accessible to users with disabilities

---

## Implementation Timeline

| Tier | Description | Effort | Dependencies | Priority |
|------|-------------|--------|--------------|----------|
| 1 | Basic Panning | 4 hours | None | **Critical** |
| 2 | Pinch Zoom | 6 hours | Tier 1 | **High** |
| 3 | Shape Manipulation | 8 hours | Tier 1, Tier 2 | High |
| 4 | UX Enhancements | 12 hours | Tier 1, Tier 2, Tier 3 | Medium |
| 5 | Accessibility | 6 hours | All prior tiers | Medium |

**Total Estimated Effort:** 36 hours (~1 sprint)

### Recommended Rollout Strategy
1. **Week 1:** Implement Tier 1 + Tier 2 → Release as beta
2. **Week 2:** Implement Tier 3 → Release as stable mobile support
3. **Week 3:** Implement Tier 4 → Polish release
4. **Week 4:** Implement Tier 5 + comprehensive testing

---

## Testing Strategy

### Device Matrix
- **iOS:** iPhone SE (small), iPhone 14 Pro (standard), iPad Air (tablet)
- **Android:** Pixel 5 (standard), Samsung Galaxy S23 (high-end), Samsung Fold (foldable)
- **Browsers:** Safari (iOS), Chrome (Android), Firefox (Android), Samsung Internet

### Test Scenarios
1. **Basic Navigation:** Pan, zoom, return to origin
2. **Shape Interaction:** Select, drag, resize, delete
3. **Multi-Gesture:** Pan then zoom, zoom then pan, interrupted gestures
4. **Performance:** 100+ shapes on canvas, rapid gestures
5. **Edge Cases:** Orientation change mid-drag, phone call during pan, low battery mode
6. **Accessibility:** VoiceOver (iOS), TalkBack (Android), high contrast, reduced motion

### Metrics to Monitor
- **Performance:** Frame rate during pan/zoom (target: 60fps)
- **Responsiveness:** Touch to paint time (target: <16ms)
- **Accuracy:** Pinch zoom coordinate stability (target: <1px drift)
- **Compatibility:** Success rate across device matrix (target: 95%)

---

## Risk Mitigation

### High-Risk Areas
1. **Coordinate transformation bugs:** Extensive unit tests for touch → canvas conversion
2. **Gesture conflicts:** State machine to manage interaction modes
3. **Desktop regression:** Automated tests for mouse interactions
4. **Performance degradation:** Profiling before/after each tier

### Rollback Plan
- Feature flag: `ENABLE_TOUCH_SUPPORT` (default: true)
- Can disable per-tier if issues arise
- Separate build for mobile-only testing

---

## Success Criteria

### Must-Have (Tier 1-2)
- ✅ Mobile users can pan and zoom the canvas
- ✅ Zero desktop functionality regression
- ✅ Touch performance feels native (60fps)

### Should-Have (Tier 3)
- ✅ Mobile users can manipulate shapes
- ✅ Touch targets meet accessibility standards
- ✅ Gesture conflicts resolved

### Nice-to-Have (Tier 4-5)
- ✅ Polished mobile UX with animations
- ✅ Comprehensive accessibility support
- ✅ Edge case handling for all device types

---

## Open Questions

1. **Should we support three-finger gestures?** (e.g., three-finger swipe for undo)
2. **Do we need a separate mobile-optimized layout?** (responsive vs. dedicated)
3. **Should pinch zoom be bounded to prevent extreme zoom levels?**
4. **How should we handle text input on mobile?** (native keyboard vs. custom)
5. **Should we implement a "mobile mode" toggle for desktop users testing?**

---

## References

- **Touch Events Spec:** https://w3c.github.io/touch-events/
- **Pointer Events Spec:** https://w3c.github.io/pointerevents/
- **Mobile Accessibility:** https://www.w3.org/WAI/standards-guidelines/mobile/
- **React Touch Handling:** https://react.dev/reference/react-dom/components/common#touch-events

---

## Appendix: Code Locations Quick Reference

| Component | File | Lines |
|-----------|------|-------|
| Mouse handlers | `DemoFigma.tsx` | 825-987 |
| Zoom handler | `DemoFigma.tsx` | 736-771 |
| Shape interaction | `DemoFigma.tsx` | 989-1122 |
| Canvas container | `DemoFigma.tsx` | 1446-1461 |
| State management | `DemoFigma.tsx` | 102-110 |
| Mapbox ref | `DemoFigma.tsx` | Line 85 |

---

**Document Status:** Ready for Implementation
**Next Step:** Review with team → Begin Tier 1 implementation
