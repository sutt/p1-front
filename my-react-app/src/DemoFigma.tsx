import { useState, useRef, MouseEvent, CSSProperties, useEffect, useCallback, Fragment } from 'react';
import './DemoFigma.css';

// Module-wide debug flag
const DEBUG = true;

type ShapeType = 'rectangle' | 'circle';

interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  selectedBy: string[];
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
      x: Math.round(x),
      y: Math.round(y),
      width: getRandomSize(),
      height: getRandomSize(),
      selectedBy: [],
    };
  } else { // circle
    return {
      id,
      type: 'circle',
      x: Math.round(x),
      y: Math.round(y),
      radius: getRandomSize(),
      selectedBy: [],
    };
  }
};

const isPointInRectangle = (px: number, py: number, rect: RectangleShape) => {
  return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height;
};

const isPointInCircle = (px: number, py: number, circle: CircleShape) => {
  const distance = Math.sqrt((px - circle.x) ** 2 + (py - circle.y) ** 2);
  return distance <= circle.radius;
};

function DemoFigma() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [currentTool, setCurrentTool] = useState<ShapeType | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState("User1");
  const [hintMessage, setHintMessage] = useState('');

  const selectedShapeForCurrentUser = shapes.find(s => s.selectedBy.includes(currentUser));

  const fetchShapes = useCallback(async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    try {
      const response = await fetch(`${apiUrl}/shapes`, {
        mode: 'cors'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Shape[] = await response.json();
      // When we GET, we want to keep all selectedBy except for currentUser
      // When we POST/UPDATE, we want to only send selectedBy for currentUser
      const shapesWithSelection = data.map(shape => ({ ...shape, selectedBy: shape.selectedBy }));
      setShapes(shapesWithSelection);
    } catch (error) {
      console.error("Error fetching or converting data:", error);
    }
  }, []);

  const updateShapesOnServer = useCallback(async (shapesToUpdate: Shape[]) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const payload = {
      user: currentUser,
      data: shapesToUpdate,
    };

    if (DEBUG) {
      console.log('Kicking off XHR POST to /shapes');
      console.log('Sending shapes data:', payload.data);
    }

    try {
      const response = await fetch(`${apiUrl}/shapes`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating shapes on server:", error);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchShapes(); // initial fetch
    const pollingInterval = parseInt(import.meta.env.VITE_POLLING_INTERVAL_MS || '2000', 10);
    const intervalId = setInterval(fetchShapes, pollingInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchShapes]);

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
    if (currentTool || isSelectMode) return;

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
      setShapes(prevShapes => {
        const newShapes = [...prevShapes, newShape];
        updateShapesOnServer(newShapes);
        return newShapes;
      });
      setCurrentTool(null);
      return;
    }

    if (isMoveMode && selectedShapeForCurrentUser) {
      setShapes(prevShapes => {
        const newShapes = prevShapes.map(shape =>
          shape.id === selectedShapeForCurrentUser.id
            ? { ...shape, x: Math.round(canvasX), y: Math.round(canvasY) }
            : shape
        );
        updateShapesOnServer(newShapes);
        return newShapes;
      });
      setIsMoveMode(false);
      setHintMessage('Shape moved. Move-shape mode is deactivated.');
      setTimeout(() => setHintMessage(''), 3000);
      return;
    }

    if (isSelectMode) {
      let clickedShape: Shape | null = null;
      // Find the topmost shape that was clicked
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        let hit = false;
        if (shape.type === 'rectangle') {
          hit = isPointInRectangle(canvasX, canvasY, shape);
        } else {
          hit = isPointInCircle(canvasX, canvasY, shape);
        }
        if (hit) {
          clickedShape = shape;
          break;
        }
      }

      setShapes(prevShapes => {
        const newShapes = prevShapes.map(shape => {
          const newSelectedBy = [...shape.selectedBy];
          const userIndex = newSelectedBy.indexOf(currentUser);

          if (shape.id === clickedShape?.id) {
            // This is the clicked shape
            if (userIndex > -1) {
              // Already selected by user, so deselect
              newSelectedBy.splice(userIndex, 1);
            } else {
              // Not selected, so select
              newSelectedBy.push(currentUser);
            }
          } else {
            // This is not the clicked shape, deselect for current user
            if (userIndex > -1) {
              newSelectedBy.splice(userIndex, 1);
            }
          }
          return { ...shape, selectedBy: newSelectedBy };
        });
        updateShapesOnServer(newShapes);
        return newShapes;
      });
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

  const getHintText = () => {
    if (hintMessage) {
      return hintMessage;
    }
    if (currentTool) {
      return `Click on the canvas to place a ${currentTool}`;
    }
    if (isMoveMode) {
      return "Awaiting new position for the selected shape.";
    }

    let message = '';
    if (isSelectMode) {
      message += 'In Select mode. ';
    }

    if (selectedShapeForCurrentUser) {
      message += 'You have a shape selected.';
    } else {
      message += 'You do not have a shape selected.';
    }
    
    return message;
  };

  return (
    <div className="figma-clone">
      <div className="top-bar">
        <div className="menu-section">
          {/* Placeholder for menu */}
          <span>Menu</span>
          <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={fetchShapes}>Get Data</button>
            <span>Current User: {currentUser}</span>
            <button onClick={() => setCurrentUser(currentUser === 'User1' ? 'User2' : 'User1')}>
              Switch User
            </button>
            <button onClick={() => console.log('Shapes:', shapes)}>
              Print Shapes
            </button>
          </div>
        </div>
        <div className="tools-section">
          <div>
            <button onClick={handleZoomIn}>Zoom In</button>
            <button onClick={handleZoomOut}>Zoom Out</button>
            <button onClick={() => handlePan(0, 50)}>Pan Up</button>
            <button onClick={() => handlePan(0, -50)}>Pan Down</button>
            <button onClick={() => handlePan(50, 0)}>Pan Left</button>
            <button onClick={() => handlePan(-50, 0)}>Pan Right</button>
            <button
              onClick={() => {
                const newIsSelectMode = !isSelectMode;
                setIsSelectMode(newIsSelectMode);
                if (newIsSelectMode) {
                  setCurrentTool(null);
                  setIsMoveMode(false);
                }
              }}
              style={{ backgroundColor: isSelectMode ? '#cce5ff' : undefined }}
            >
              Select Mode
            </button>
            <button
              onClick={() => {
                if (selectedShapeForCurrentUser) {
                  const newIsMoveMode = !isMoveMode;
                  setIsMoveMode(newIsMoveMode);
                  if (newIsMoveMode) {
                    setCurrentTool(null);
                    setIsSelectMode(false);
                  }
                }
              }}
              disabled={!selectedShapeForCurrentUser}
              title={!selectedShapeForCurrentUser ? "Select a shape to enable move mode" : ""}
              style={{ backgroundColor: isMoveMode ? '#cce5ff' : undefined }}
            >
              Move Shape
            </button>
          </div>
          <div>
            <button onClick={() => { setCurrentTool('rectangle'); setIsSelectMode(false); setIsMoveMode(false); }}>Rectangle</button>
            <button onClick={() => { setCurrentTool('circle'); setIsSelectMode(false); setIsMoveMode(false); }}>Circle</button>
            <span>{getHintText()}</span>
          </div>
        </div>
      </div>
      <div
        ref={canvasRef}
        className={`canvas-container ${currentTool || isSelectMode ? 'shape-creation-mode' : ''}`}
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
            const isSelected = shape.selectedBy.length > 0;
            if (shape.type === 'rectangle') {
              return (
                <Fragment key={shape.id}>
                  {isSelected && (
                    <div
                      className="shape-tooltip"
                      style={{
                        left: `${shape.x}px`,
                        top: `${shape.y}px`,
                      }}
                    >
                      {shape.selectedBy.join(', ')}
                    </div>
                  )}
                  <div
                    className={`shape rectangle ${isSelected ? 'selected' : ''}`}
                    style={{
                      left: `${shape.x}px`,
                      top: `${shape.y}px`,
                      width: `${shape.width}px`,
                      height: `${shape.height}px`,
                    }}
                  />
                </Fragment>
              );
            }
            if (shape.type === 'circle') {
              return (
                <Fragment key={shape.id}>
                  {isSelected && (
                    <div
                      className="shape-tooltip"
                      style={{
                        left: `${shape.x - shape.radius}px`,
                        top: `${shape.y - shape.radius}px`,
                      }}
                    >
                      {shape.selectedBy.join(', ')}
                    </div>
                  )}
                  <div
                    className={`shape circle ${isSelected ? 'selected' : ''}`}
                    style={{
                      left: `${shape.x - shape.radius}px`,
                      top: `${shape.y - shape.radius}px`,
                      width: `${shape.radius * 2}px`,
                      height: `${shape.radius * 2}px`,
                    }}
                  />
                </Fragment>
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
