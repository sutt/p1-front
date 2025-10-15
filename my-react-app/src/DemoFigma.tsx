import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import type { MouseEvent, CSSProperties } from 'react';
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

interface UserOnlineResponse {
  userName: string;
  created_at: string;
}

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

const formatDuration = (createdAt: string) => {
  const now = new Date();
  const createdDate = new Date(createdAt);
  const seconds = Math.floor((now.getTime() - createdDate.getTime()) / 1000);

  if (seconds < 60) {
    return `Online for ${seconds} second${seconds === 1 ? '' : 's'}`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `Online for ${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(minutes / 60);
  return `Online for ${hours} hour${hours === 1 ? '' : 's'}`;
};

function DemoFigma() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [activeTool, setActiveTool] = useState<'rectangle' | 'circle' | 'select' | null>(null);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState('');
  const [hintMessage, setHintMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<UserOnlineResponse[]>([]);
  const [showDebugTools, setShowDebugTools] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState<'login' | 'signup' | null>(null);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const hideDebugMenu = import.meta.env.VITE_HIDE_DEBUG_MENU === 'true';

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      if (token) {
        try {
          const response = await fetch(`${apiUrl}/api/me`, {
            mode: 'cors',
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          });
          if (response.ok) {
            const user = await response.json();
            setCurrentUser(user.username);
          } else {
            localStorage.removeItem('jwt_token');
            setHintMessage('Your session expired. Please sign in again.');
            setTimeout(() => setHintMessage(''), 3000);
            const anonUser = `Anon${Math.floor(1000 + Math.random() * 9000)}`;
            setCurrentUser(anonUser);
          }
        } catch (error) {
          console.error("Error verifying token:", error);
          localStorage.removeItem('jwt_token');
          const anonUser = `Anon${Math.floor(1000 + Math.random() * 9000)}`;
          setCurrentUser(anonUser);
        }
      } else {
        const anonUser = `Anon${Math.floor(1000 + Math.random() * 9000)}`;
        setCurrentUser(anonUser);
      }
    };
    checkAuth();
  }, []);

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
      const serverShapes: Shape[] = await response.json();
      
      setShapes(localShapes => {
        if (localShapes.length === 0) {
          return serverShapes;
        }

        const localShapesMap = new Map(localShapes.map(s => [s.id, s]));
        const serverShapesMap = new Map(serverShapes.map(s => [s.id, s]));

        // Start with server state
        const mergedShapesMap = new Map(serverShapesMap);

        for (const [id, localShape] of localShapesMap.entries()) {
          const serverShape = serverShapesMap.get(id);

          if (!serverShape) {
            // New shape created locally, add it to the map.
            mergedShapesMap.set(id, localShape);
          } else {
            // Existing shape, merge properties.
            const mergedShape = { ...serverShape }; // Start with server version

            // Preserve current user's selection from local state.
            const isSelectedLocally = localShape.selectedBy.includes(currentUser);
            const otherUsersSelections = serverShape.selectedBy.filter(u => u !== currentUser);
            
            mergedShape.selectedBy = [...otherUsersSelections];
            if (isSelectedLocally) {
              mergedShape.selectedBy.push(currentUser);
            }

            // If shape is selected by current user, local position is authoritative.
            if (isSelectedLocally) {
              mergedShape.x = localShape.x;
              mergedShape.y = localShape.y;
            }
            
            mergedShapesMap.set(id, mergedShape);
          }
        }
        return Array.from(mergedShapesMap.values());
      });
    } catch (error) {
      console.error("Error fetching or converting data:", error);
    }
  }, [currentUser]);

  const updateShapesOnServer = useCallback(async (shapesToUpdate: Shape[]) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    try {
      // 1. Get most recent data from server
      const response = await fetch(`${apiUrl}/shapes`, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const serverShapes: Shape[] = await response.json();

      // 2. Upsert client's state to this updated data
      const shapesToUpdateMap = new Map(shapesToUpdate.map(s => [s.id, s]));
      const serverShapesMap = new Map(serverShapes.map(s => [s.id, s]));

      // Merge server shapes with local changes. Local changes win.
      const mergedShapesMap = new Map([...serverShapesMap, ...shapesToUpdateMap]);
      const finalShapes = Array.from(mergedShapesMap.values());

      const payload = {
        user: currentUser,
        data: finalShapes,
      };

      if (DEBUG) {
        console.log('Kicking off XHR POST to /shapes');
        console.log('Sending shapes data:', payload.data);
      }

      const postResponse = await fetch(`${apiUrl}/shapes`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!postResponse.ok) {
        throw new Error(`HTTP error! status: ${postResponse.status}`);
      }
    } catch (error) {
      console.error("Error updating shapes on server:", error);
    }
  }, [currentUser]);

  const handleSignup = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    try {
      const response = await fetch(`${apiUrl}/signup`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });
      if (response.ok) {
        setHintMessage('Signup successful! Please log in.');
        setTimeout(() => setHintMessage(''), 3000);
        setShowAuthForm(null);
        setAuthUsername('');
        setAuthPassword('');
        setAuthError('');
      } else {
        setAuthError("Looks like something went wrong, you can still continue as an Anon user for interacting with the canvas.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setAuthError("Looks like something went wrong, you can still continue as an Anon user for interacting with the canvas.");
    }
  };

  const handleLogin = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const formData = new URLSearchParams();
    formData.append('username', authUsername);
    formData.append('password', authPassword);

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('jwt_token', data.access_token);
        setCurrentUser(authUsername);
        setShowAuthForm(null);
        setAuthUsername('');
        setAuthPassword('');
        setAuthError('');
      } else {
        setAuthError("Looks like something went wrong, you can still continue as an Anon user for interacting with the canvas.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthError("Looks like something went wrong, you can still continue as an Anon user for interacting with the canvas.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    const anonUser = `Anon${Math.floor(1000 + Math.random() * 9000)}`;
    setCurrentUser(anonUser);
  };

  const handleResetData = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    try {
      const response = await fetch(`${apiUrl}/reset_data`, {
        method: 'POST',
        mode: 'cors'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // After a successful reset, we want to overwrite local state with the server's state.
      // A direct call to fetchShapes() with its new merge logic would preserve local-only shapes,
      // which is wrong after a reset. So, we fetch here and overwrite the state.
      const shapesResponse = await fetch(`${apiUrl}/shapes`, { mode: 'cors' });
      if (!shapesResponse.ok) {
        throw new Error(`HTTP error! status: ${shapesResponse.status}`);
      }
      const serverShapes: Shape[] = await shapesResponse.json();
      setShapes(serverShapes);
    } catch (error) {
      console.error("Error resetting data:", error);
    }
  };

  useEffect(() => {
    fetchShapes(); // initial fetch
    const pollingInterval = parseInt(import.meta.env.VITE_POLLING_INTERVAL_MS || '2000', 10);
    const intervalId = setInterval(fetchShapes, pollingInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchShapes]);

  useEffect(() => {
    if (!currentUser) return;

    const postUserHeartbeat = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      try {
        const response = await fetch(`${apiUrl}/user_online`, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userName: currentUser }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: UserOnlineResponse[] = await response.json();
        data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setOnlineUsers(data);
      } catch (error) {
        console.error("Error posting user heartbeat:", error);
      }
    };

    postUserHeartbeat(); // initial post
    const pollingInterval = parseInt(import.meta.env.VITE_USER_POLLING_INTERVAL_MS || '5000', 10);
    const intervalId = setInterval(postUserHeartbeat, pollingInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [currentUser]);

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
    if (activeTool) return;

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

    if (activeTool === 'rectangle' || activeTool === 'circle') {
      const newShape = createShape(activeTool, canvasX, canvasY);
      setShapes(prevShapes => {
        const newShapes = [...prevShapes, newShape];
        updateShapesOnServer(newShapes);
        return newShapes;
      });
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

    if (activeTool === 'select') {
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
    if (activeTool === 'rectangle' || activeTool === 'circle') {
      return `Click on the canvas to place a ${activeTool}`;
    }
    if (isMoveMode) {
      return "Awaiting new position for the selected shape.";
    }

    let message = '';
    if (activeTool === 'select') {
      message += 'In Select mode. ';
    }

    if (selectedShapeForCurrentUser) {
      message += 'You have a shape selected.';
    } else {
      message += 'You do not have a shape selected.';
    }
    
    return message;
  };

  const handleToolClick = (tool: 'rectangle' | 'circle' | 'select') => {
    setActiveTool(prev => {
      const newTool = prev === tool ? null : tool;
      if (newTool) {
        setIsMoveMode(false);
      }
      return newTool;
    });
  };

  return (
    <div className="figma-clone">
      <div className="top-bar">
        {!hideDebugMenu && (
          <div className="menu-section">
            <label>
              <input
                type="checkbox"
                checked={showDebugTools}
                onChange={e => setShowDebugTools(e.target.checked)}
              />
              Enable Debug Tools
            </label>
            {showDebugTools && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={fetchShapes}>Get Data</button>
                  <button onClick={handleResetData}>Reset Data</button>
                  <button onClick={() => console.log('Shapes:', shapes)}>
                    Print Shapes
                  </button>
                </div>
                <div>
                  <button onClick={handleZoomIn}>Zoom In</button>
                  <button onClick={handleZoomOut}>Zoom Out</button>
                  <button onClick={() => handlePan(0, 50)}>Pan Up</button>
                  <button onClick={() => handlePan(0, -50)}>Pan Down</button>
                  <button onClick={() => handlePan(50, 0)}>Pan Left</button>
                  <button onClick={() => handlePan(-50, 0)}>Pan Right</button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="users-section">
          <span>Current User: {currentUser}</span>
          {currentUser.startsWith('Anon') ? (
            <>
              <button onClick={() => { setShowAuthForm('login'); setAuthError(''); }}>Login</button>
              <button onClick={() => { setShowAuthForm('signup'); setAuthError(''); }}>Signup</button>
            </>
          ) : (
            <button onClick={handleLogout}>Logout</button>
          )}
          {showAuthForm && (
            <div className="auth-form">
              <h3>{showAuthForm === 'login' ? 'Login' : 'Signup'}</h3>
              <input
                type="text"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="Username"
              />
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Password"
              />
              <button onClick={showAuthForm === 'login' ? handleLogin : handleSignup}>
                {showAuthForm === 'login' ? 'Login' : 'Signup'}
              </button>
              <button onClick={() => setShowAuthForm(null)}>Cancel</button>
              {authError && <p style={{ color: 'red' }}>{authError}</p>}
            </div>
          )}
        </div>
        <div className="online-users-section">
          <span>
            Users Online: {onlineUsers.map((user, index) => (
              <span key={user.userName} title={formatDuration(user.created_at)}>
                {user.userName}{index < onlineUsers.length - 1 ? ', ' : ''}
              </span>
            ))}
          </span>
        </div>
        <div className="tools-section">
          <div>
            <span>Selection Tools: </span>
            <button
              onClick={() => handleToolClick('select')}
              className={activeTool === 'select' ? 'active' : ''}
            >
              Select Mode
            </button>
            <button
              onClick={() => {
                if (selectedShapeForCurrentUser) {
                  const newIsMoveMode = !isMoveMode;
                  setIsMoveMode(newIsMoveMode);
                  if (newIsMoveMode) {
                    setActiveTool(null);
                  }
                }
              }}
              disabled={!selectedShapeForCurrentUser}
              title={!selectedShapeForCurrentUser ? "Select a shape to enable move mode" : ""}
              className={isMoveMode ? 'active' : ''}
            >
              Move Shape
            </button>
          </div>
          <div>
            <span>Shape Tools: </span>
            <button
              onClick={() => handleToolClick('rectangle')}
              className={activeTool === 'rectangle' ? 'active' : ''}
            >
              Rectangle
            </button>
            <button
              onClick={() => handleToolClick('circle')}
              className={activeTool === 'circle' ? 'active' : ''}
            >
              Circle
            </button>
            <span>{getHintText()}</span>
          </div>
        </div>
      </div>
      <div
        ref={canvasRef}
        className={`canvas-container ${activeTool ? 'shape-creation-mode' : ''}`}
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
