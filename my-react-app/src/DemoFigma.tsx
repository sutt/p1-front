import { useState, useRef, MouseEvent, CSSProperties, useEffect, useCallback } from 'react';
import './DemoFigma.css';

// Module-wide debug flag
const DEBUG = true;

type ShapeType = 'rectangle' | 'circle';

interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
}

interface RectangleShape extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
}

interface CircleShape extends BaseShape {
  type: 'circle';
  radius: number;
}

type Shape = RectangleShape | CircleShape;

const getRandomSize = () => Math.floor(Math.random() * (300 - 100 + 1)) + 100;

const createShape = (type: ShapeType, x: number, y: number): Shape => {
  const id = `shape_${Date.now()}`;
  if (type === 'rectangle') {
    return {
      id,
      type: 'rectangle',
      x,
      y,
      width: getRandomSize(),
      height: getRandomSize(),
    };
  } else { // circle
    return {
      id,
      type: 'circle',
      x,
      y,
      radius: getRandomSize(),
    };
  }
};

function DemoFigma() {
  const [shapes, setShapes] = useState<Shape[]>([
    { id: 'rect1', type: 'rectangle', x: 100, y: 100, width: 300, height: 200 },
    { id: 'circ1', type: 'circle', x: 600, y: 400, radius: 100 },
  ]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [currentTool, setCurrentTool] = useState<ShapeType | null>(null);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: globalThis.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    // Get mouse position relative to canvas container
    if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate the point in the canvas coordinate system the mouse is over
        const pointX = (mouseX - pan.x) / zoom;
        const pointY = (mouseY - pan.y) / zoom;

        const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;

        // Adjust pan to keep the point under the mouse
        const newPanX = mouseX - pointX * newZoom;
        const newPanY = mouseY - pointY * newZoom;

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });

        if (DEBUG) {
            console.log('Zoom state:', { zoom: newZoom, pan: {x: newPanX, y: newPanY} });
        }
    }
  }, [pan, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        canvas.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleWheel]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (currentTool) return;

    // Pan on left mouse button or middle mouse button
    if (e.button === 0 || e.button === 1) {
      e.preventDefault();
      if (e.button === 0 && DEBUG) {
        console.log('Pan start:', { x: e.clientX, y: e.clientY });
      }
      setIsPanning(true);
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePosition.current.x;
      const dy = e.clientY - lastMousePosition.current.y;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      
      setPan(prevPan => {
        const newPan = { x: prevPan.x + dx, y: prevPan.y + dy };
        if (DEBUG) {
          console.log('Pan state:', newPan);
        }
        return newPan;
      });
    }
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button === 0 || e.button === 1) {
      if (e.button === 0 && isPanning && DEBUG) {
        console.log('Pan stop:', { x: e.clientX, y: e.clientY });
      }
      setIsPanning(false);
    }
  };

  const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const canvasX = (mouseX - pan.x) / zoom;
    const canvasY = (mouseY - pan.y) / zoom;

    if (currentTool) {
      const newShape = createShape(currentTool, canvasX, canvasY);
      setShapes(prevShapes => [...prevShapes, newShape]);
      setCurrentTool(null);
      return;
    }

    if (DEBUG) {
      console.log(`Canvas Coords: (${canvasX.toFixed(2)}, ${canvasY.toFixed(2)})`);
    }
  };

  const handleZoomIn = () => setZoom(z => z * 1.2);
  const handleZoomOut = () => setZoom(z => z / 1.2);

  const handlePan = (dx: number, dy: number) => {
    setPan(prevPan => ({ x: prevPan.x + dx, y: prevPan.y + dy }));
  };

  return (
    <div className="figma-clone">
      <div className="top-bar">
        <div className="menu-section">
          {/* Placeholder for menu */}
          <span>Menu</span>
        </div>
        <div className="tools-section">
          <div>
            <button onClick={handleZoomIn}>Zoom In</button>
            <button onClick={handleZoomOut}>Zoom Out</button>
            <button onClick={() => handlePan(0, 50)}>Pan Up</button>
            <button onClick={() => handlePan(0, -50)}>Pan Down</button>
            <button onClick={() => handlePan(50, 0)}>Pan Left</button>
            <button onClick={() => handlePan(-50, 0)}>Pan Right</button>
          </div>
          <div>
            <button onClick={() => setCurrentTool('rectangle')}>Rectangle</button>
            <button onClick={() => setCurrentTool('circle')}>Circle</button>
            {currentTool && <span>Click on the canvas to place a {currentTool}</span>}
          </div>
        </div>
      </div>
      <div
        ref={canvasRef}
        className={`canvas-container ${currentTool ? 'shape-creation-mode' : ''}`}
        style={{
          '--grid-size': `${50 * zoom}px`,
          '--pan-x': `${pan.x}px`,
          '--pan-y': `${pan.y}px`,
        } as CSSProperties}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Stop panning if mouse leaves canvas
        onClick={handleCanvasClick}
        onContextMenu={(e) => e.preventDefault()} // prevent context menu on right click
      >
        <div
          className="canvas-content"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
          }}
        >
          {shapes.map(shape => {
            if (shape.type === 'rectangle') {
              return (
                <div
                  key={shape.id}
                  className="shape rectangle"
                  style={{
                    left: `${shape.x}px`,
                    top: `${shape.y}px`,
                    width: `${shape.width}px`,
                    height: `${shape.height}px`,
                  }}
                />
              );
            }
            if (shape.type === 'circle') {
              return (
                <div
                  key={shape.id}
                  className="shape circle"
                  style={{
                    left: `${shape.x - shape.radius}px`,
                    top: `${shape.y - shape.radius}px`,
                    width: `${shape.radius * 2}px`,
                    height: `${shape.radius * 2}px`,
                  }}
                />
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

export default DemoFigma;
