import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import type { MouseEvent, CSSProperties, FormEvent } from 'react';
import './DemoFigma.css';
import { sendAIMessage, type AICommand } from './services/aiService';


// Module-wide debug flag
const DEBUG = false;

type ShapeType = 'rectangle' | 'circle' | 'text';

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

interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  width: number;
  height: number;
}

type Shape = RectangleShape | CircleShape | TextShape;

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
  } else if (type === 'circle') {
    return {
      id,
      type: 'circle',
      x: Math.round(x),
      y: Math.round(y),
      radius: getRandomSize(),
      selectedBy: [],
    };
  } else { // text
    return {
      id,
      type: 'text',
      x: Math.round(x),
      y: Math.round(y),
      text: 'this is text',
      width: 200,
      height: 50,
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

const isPointInText = (px: number, py: number, text: TextShape) => {
  return px >= text.x && px <= text.x + text.width && py >= text.y && py <= text.y + text.height;
};

function DemoFigma() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [activeTool, setActiveTool] = useState<'rectangle' | 'circle' | 'text' | 'select' | null>(null);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const onlineUsersRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState('');
  const [hintMessage, setHintMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<UserOnlineResponse[]>([]);
  const [showDebugTools, setShowDebugTools] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState<'login' | 'signup' | null>(null);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);
  const [draggingShape, setDraggingShape] = useState<{ id: string; startX: number; startY: number; mouseStartX: number; mouseStartY: number; } | null>(null);
  const [resizingState, setResizingState] = useState<{
    id: string;
    handle: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    mouseStartX: number;
    mouseStartY: number;
  } | null>(null);
  const dragHappened = useRef(false);
  const [aiInput, setAiInput] = useState('');
  const [aiIsLoading, setAiIsLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiModel, setAiModel] = useState('gpt-4o');
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const hideDebugMenu = import.meta.env.VITE_HIDE_DEBUG_MENU === 'true';

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      if (token) {
        try {
          const response = await fetch(`${apiUrl}/me`, {
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

            // If this shape is being edited, preserve its text content from local state.
            if (id === editingShapeId && localShape.type === 'text') {
              (mergedShape as TextShape).text = (localShape as TextShape).text;
            }

            // Preserve current user's selection from local state.
            // Rule: Only one user can select a shape.
            const isSelectedLocally = localShape.selectedBy.includes(currentUser);
            
            if (isSelectedLocally) {
              // If selected locally by the current user, that takes precedence on this client.
              mergedShape.selectedBy = [currentUser];
            } else {
              // Otherwise, use the server's selection state.
              // To be safe against legacy data, only take the first user.
              mergedShape.selectedBy = serverShape.selectedBy.slice(0, 1);
            }

            // If shape is selected by current user, local geometry is authoritative.
            if (isSelectedLocally) {
              mergedShape.x = localShape.x;
              mergedShape.y = localShape.y;
              if (localShape.type === 'rectangle' || localShape.type === 'text') {
                (mergedShape as RectangleShape | TextShape).width = localShape.width;
                (mergedShape as RectangleShape | TextShape).height = localShape.height;
              } else if (localShape.type === 'circle') {
                (mergedShape as CircleShape).radius = localShape.radius;
              }
            }
            
            mergedShapesMap.set(id, mergedShape);
          }
        }
        return Array.from(mergedShapesMap.values());
      });
    } catch (error) {
      console.error("Error fetching or converting data:", error);
    }
  }, [currentUser, editingShapeId]);

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

  const executeAICommands = useCallback((commands: AICommand[]) => {
    setShapes(prevShapes => {
      const newShapes = [...prevShapes];
      let changed = false;

      for (const cmd of commands) {
        switch (cmd.action) {
          case 'createShape': {
            const { type, x, y, width, height, radius, text } = cmd.params;
            const id = `shape_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            let shapeToAdd: Shape | null = null;

            if (type === 'rectangle') {
              shapeToAdd = {
                id, type: 'rectangle', x: Math.round(x), y: Math.round(y),
                width: width !== undefined ? Math.round(width) : getRandomSize(),
                height: height !== undefined ? Math.round(height) : getRandomSize(),
                selectedBy: []
              };
            } else if (type === 'circle') {
              shapeToAdd = {
                id, type: 'circle', x: Math.round(x), y: Math.round(y),
                radius: radius !== undefined ? Math.round(radius) : getRandomSize(),
                selectedBy: []
              };
            } else if (type === 'text') {
              shapeToAdd = {
                id, type: 'text', x: Math.round(x), y: Math.round(y),
                text: text || 'this is text',
                width: width !== undefined ? Math.round(width) : 200,
                height: height !== undefined ? Math.round(height) : 50,
                selectedBy: []
              };
            }

            if (shapeToAdd) {
              newShapes.push(shapeToAdd);
              changed = true;
            }
            break;
          }
          case 'moveShape': {
            const { shapeId, x, y } = cmd.params;
            const shapeIndex = newShapes.findIndex(s => s.id === shapeId);
            if (shapeIndex !== -1) {
              newShapes[shapeIndex] = { ...newShapes[shapeIndex], x: Math.round(x), y: Math.round(y) };
              changed = true;
            }
            break;
          }
          case 'resizeShape': {
            const { shapeId, width, height, radius } = cmd.params;
            const shapeIndex = newShapes.findIndex(s => s.id === shapeId);
            if (shapeIndex !== -1) {
              const originalShape = newShapes[shapeIndex];
              const updatedShape = { ...originalShape };
              if (originalShape.type === 'rectangle' || originalShape.type === 'text') {
                if (width !== undefined) (updatedShape as RectangleShape | TextShape).width = Math.round(width);
                if (height !== undefined) (updatedShape as RectangleShape | TextShape).height = Math.round(height);
              } else if (originalShape.type === 'circle') {
                if (radius !== undefined) (updatedShape as CircleShape).radius = Math.round(radius);
              }
              newShapes[shapeIndex] = updatedShape;
              changed = true;
            }
            break;
          }
          // MANUAL INTERVENTION: The following command handlers are placeholders.
          // They need to be fully implemented to support all AI capabilities.
          case 'selectShape': {
            // This should interact with the selection state.
            console.warn(`AI command not implemented: ${cmd.action}`, cmd.params);
            break;
          }
          case 'arrangeShapes': {
            // This requires implementing layout algorithms.
            console.warn(`AI command not implemented: ${cmd.action}`, cmd.params);
            break;
          }
          default:
            console.warn(`Unknown AI command: ${cmd.action}`);
        }
      }

      if (changed) {
        updateShapesOnServer(newShapes);
        return newShapes;
      }
      return prevShapes;
    });
  }, [updateShapesOnServer]);

  const handleAIChatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    setAiIsLoading(true);
    setAiMessage('');

    try {
      const response = await sendAIMessage({
        user: currentUser,
        message: aiInput,
        canvasState: {
          shapes,
          viewport: { zoom, pan }
        },
        model: aiModel,
      });

      setAiMessage(response.message);
      if (response.commands.length > 0) {
        executeAICommands(response.commands);
      }
    } catch (error) {
      console.error("AI request failed:", error);
      setAiMessage("Sorry, something went wrong.");
    } finally {
      setAiIsLoading(false);
      setAiInput('');
    }
  };

  const finishEditing = useCallback(async () => {
    const shapeToUpdate = shapes.find(s => s.id === editingShapeId);
    if (shapeToUpdate) {
      // By awaiting the server update before hiding the editor, we prevent a race
      // condition where a polling fetch could overwrite the local optimistic
      // text update with stale data from the server.
      await updateShapesOnServer([shapeToUpdate]);
    }
    setEditingShapeId(null);
  }, [shapes, updateShapesOnServer, editingShapeId]);

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
        await handleLogin();
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

  const handleResizeMouseDown = (e: MouseEvent, shape: Shape, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    dragHappened.current = false;

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const canvasX = (mouseX - pan.x) / zoom;
    const canvasY = (mouseY - pan.y) / zoom;

    let startWidth, startHeight, startX, startY;

    if (shape.type === 'rectangle' || shape.type === 'text') {
      startWidth = shape.width;
      startHeight = shape.height;
      startX = shape.x;
      startY = shape.y;
    } else { // circle
      startWidth = shape.radius * 2;
      startHeight = shape.radius * 2;
      startX = shape.x - shape.radius;
      startY = shape.y - shape.radius;
    }

    setResizingState({
      id: shape.id,
      handle,
      startX,
      startY,
      startWidth,
      startHeight,
      mouseStartX: canvasX,
      mouseStartY: canvasY,
    });
  };

  const handleResetData = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    try {
      const response = await fetch(`${apiUrl}/api/reset_data`, {
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

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (onlineUsersRef.current && !onlineUsersRef.current.contains(event.target as Node)) {
        setShowOnlineUsers(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToolClick = useCallback((tool: 'rectangle' | 'circle' | 'text' | 'select') => {
    setActiveTool(prev => {
      const newTool = prev === tool ? null : tool;
      if (newTool) {
        setIsMoveMode(false);
      }
      return newTool;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input, textarea, the auth modal is open, or editing a shape
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || showAuthForm || editingShapeId) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          handleToolClick('select');
          break;
        case 'r':
          handleToolClick('rectangle');
          break;
        case 'o':
          handleToolClick('circle');
          break;
        case 't':
          handleToolClick('text');
          break;
        case 'm':
          if (selectedShapeForCurrentUser) {
            const newIsMoveMode = !isMoveMode;
            setIsMoveMode(newIsMoveMode);
            if (newIsMoveMode) {
              setActiveTool(null);
            }
          }
          break;
        case 'escape':
          setActiveTool(null);
          setIsMoveMode(false);
          setHintMessage('Exited current mode.');
          setTimeout(() => setHintMessage(''), 2000);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAuthForm, editingShapeId, selectedShapeForCurrentUser, isMoveMode, handleToolClick]);

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
    dragHappened.current = false;
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
    if (resizingState && canvasRef.current) {
      dragHappened.current = true;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const canvasX = (mouseX - pan.x) / zoom;
      const canvasY = (mouseY - pan.y) / zoom;

      const dx = canvasX - resizingState.mouseStartX;
      const dy = canvasY - resizingState.mouseStartY;

      setShapes(prevShapes => prevShapes.map(s => {
        if (s.id === resizingState.id) {
          const newShape = { ...s };
          const { startX, startY, startWidth, startHeight } = resizingState;

          let newX = startX;
          let newY = startY;
          let newWidth = startWidth;
          let newHeight = startHeight;

          if (resizingState.handle.includes('e')) {
            newWidth = startWidth + dx;
          }
          if (resizingState.handle.includes('w')) {
            newWidth = startWidth - dx;
            newX = startX + dx;
          }
          if (resizingState.handle.includes('s')) {
            newHeight = startHeight + dy;
          }
          if (resizingState.handle.includes('n')) {
            newHeight = startHeight - dy;
            newY = startY + dy;
          }

          // Prevent negative dimensions
          if (newWidth < 10) {
            newWidth = 10;
            if (resizingState.handle.includes('w')) {
              newX = startX + startWidth - 10;
            }
          }
          if (newHeight < 10) {
            newHeight = 10;
            if (resizingState.handle.includes('n')) {
              newY = startY + startHeight - 10;
            }
          }

          if (newShape.type === 'rectangle' || newShape.type === 'text') {
            newShape.x = Math.round(newX);
            newShape.y = Math.round(newY);
            newShape.width = Math.round(newWidth);
            newShape.height = Math.round(newHeight);
          } else if (newShape.type === 'circle') {
            const radius = Math.round(Math.max(newWidth, newHeight) / 2);
            newShape.radius = radius < 5 ? 5 : radius;
            newShape.x = Math.round(newX + newWidth / 2);
            newShape.y = Math.round(newY + newHeight / 2);
          }
          return newShape;
        }
        return s;
      }));
      return;
    }

    if (draggingShape && canvasRef.current) {
      dragHappened.current = true;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const canvasX = (mouseX - pan.x) / zoom;
      const canvasY = (mouseY - pan.y) / zoom;

      const dx = canvasX - draggingShape.mouseStartX;
      const dy = canvasY - draggingShape.mouseStartY;

      setShapes(prevShapes => prevShapes.map(s => {
        if (s.id === draggingShape.id) {
          return { ...s, x: Math.round(draggingShape.startX + dx), y: Math.round(draggingShape.startY + dy) };
        }
        return s;
      }));
      return;
    }

    if (isPanning) {
      dragHappened.current = true;
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
    if (resizingState) {
      const shapeToUpdate = shapes.find(s => s.id === resizingState.id);
      if (shapeToUpdate) {
        updateShapesOnServer([shapeToUpdate]);
      }
      setResizingState(null);
    }

    if (draggingShape) {
      const shapeToUpdate = shapes.find(s => s.id === draggingShape.id);
      if (shapeToUpdate) {
        updateShapesOnServer([shapeToUpdate]);
      }
      setDraggingShape(null);
    }

    if (e.button === 0 || e.button === 1) {
      if (e.button === 0 && isPanning && DEBUG) {
        console.log('Pan stop:', { x: e.clientX, y: e.clientY });
      }
      setIsPanning(false);
    }
  };

  const handleShapeMouseDown = (e: MouseEvent, shape: Shape) => {
    if (activeTool && activeTool !== 'select') return;

    e.stopPropagation();
    dragHappened.current = false;

    if (shape.selectedBy.includes(currentUser)) {
      e.preventDefault();

      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const canvasX = (mouseX - pan.x) / zoom;
      const canvasY = (mouseY - pan.y) / zoom;

      setDraggingShape({
        id: shape.id,
        startX: shape.x,
        startY: shape.y,
        mouseStartX: canvasX,
        mouseStartY: canvasY,
      });
    }
  };

  const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
    if (dragHappened.current) {
      dragHappened.current = false;
      return;
    }
    if (editingShapeId) return;
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const canvasX = (mouseX - pan.x) / zoom;
    const canvasY = (mouseY - pan.y) / zoom;

    if (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'text') {
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
        const shapeToMove = prevShapes.find(s => s.id === selectedShapeForCurrentUser.id);
        if (!shapeToMove) return prevShapes;

        const movedShape = { ...shapeToMove, x: Math.round(canvasX), y: Math.round(canvasY) };
        updateShapesOnServer([movedShape]);

        return prevShapes.map(s => s.id === movedShape.id ? movedShape : s);
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
        } else if (shape.type === 'circle') {
          hit = isPointInCircle(canvasX, canvasY, shape);
        } else if (shape.type === 'text') {
          hit = isPointInText(canvasX, canvasY, shape);
        }
        if (hit) {
          clickedShape = shape;
          break;
        }
      }

      setShapes(prevShapes => {
        // Rule: Only one user can select a shape at a time.
        const newShapes = [...prevShapes.map(s => ({...s}))]; // cheap deep copy
        let changed = false;

        // First, find my current selection
        const mySelection = newShapes.find(s => s.selectedBy.includes(currentUser));

        if (clickedShape) {
            const isSelectedByMe = clickedShape.selectedBy.includes(currentUser);
            const isSelectedByOther = clickedShape.selectedBy.length > 0 && !isSelectedByMe;

            if (isSelectedByMe) {
                // clicked my selection -> deselect
                const shape = newShapes.find(s => s.id === clickedShape.id)!;
                shape.selectedBy = [];
                changed = true;
            } else if (!isSelectedByOther) {
                // clicked available shape -> select it and deselect old one
                if (mySelection) {
                    mySelection.selectedBy = [];
                }
                const shape = newShapes.find(s => s.id === clickedShape.id)!;
                shape.selectedBy = [currentUser];
                changed = true;
            }
            // if isSelectedByOther, do nothing, selection is blocked.
        } else {
            // clicked canvas -> deselect
            if (mySelection) {
                mySelection.selectedBy = [];
                changed = true;
            }
        }

        if (changed) {
            updateShapesOnServer(newShapes);
            return newShapes;
        }
        return prevShapes;
      });
      return;
    }

    if (DEBUG) {
      console.log(`Canvas Coords: (${canvasX.toFixed(2)}, ${canvasY.toFixed(2)})`);
    }
  };

  const getHintText = () => {
    if (hintMessage) {
      return hintMessage;
    }
    if (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'text') {
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

  const [aiWidgetExpanded, setAiWidgetExpanded] = useState(false);

  return (
    <div className="figma-clone">
      <div className="top-bar">
        <div className="toolbar-left">
          <div className="shape-tools">
            <button
              onClick={() => handleToolClick('select')}
              className={`tool-button ${activeTool === 'select' ? 'active' : ''}`}
              title="Select Mode (V)"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 3L3 17L8 12L11 17L13 16L10 11L17 11L3 3Z" />
              </svg>
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
              title={!selectedShapeForCurrentUser ? "Select a shape to enable move mode" : "Move Shape (M)"}
              className={`tool-button ${isMoveMode ? 'active' : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3L7 6H9V9H6V7L3 10L6 13V11H9V14H7L10 17L13 14H11V11H14V13L17 10L14 7V9H11V6H13L10 3Z" />
              </svg>
            </button>
            <div className="separator"></div>
            <button
              onClick={() => handleToolClick('rectangle')}
              className={`tool-button ${activeTool === 'rectangle' ? 'active' : ''}`}
              title="Rectangle (R)"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="6" width="12" height="8" />
              </svg>
            </button>
            <button
              onClick={() => handleToolClick('circle')}
              className={`tool-button ${activeTool === 'circle' ? 'active' : ''}`}
              title="Circle (O)"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="6" />
              </svg>
            </button>
            <button
              onClick={() => handleToolClick('text')}
              className={`tool-button ${activeTool === 'text' ? 'active' : ''}`}
              title="Text (T)"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4V6H8.5V16H11.5V6H15V4H5Z" />
              </svg>
            </button>
          </div>
          <div className="hint-message">{getHintText()}</div>
        </div>

        <div className="toolbar-right">
          <button onClick={handleResetData}>Reset Data</button>
          <button
            className="tool-button"
            onClick={() => setShowHelp(true)}
            title="Help & Shortcuts (?)"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5.002a1 1 0 012 0v.002a1 1 0 11-2 0v-.002zM9 6a1 1 0 011-1h.01a1 1 0 010 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            className="ai-toggle-button"
            onClick={() => setAiWidgetExpanded(!aiWidgetExpanded)}
            title="Toggle AI Assistant"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2C14.42 2 18 5.58 18 10C18 14.42 14.42 18 10 18C8.85 18 7.76 17.73 6.78 17.24L2 18L3.24 14.12C2.48 12.96 2 11.54 2 10C2 5.58 5.58 2 10 2ZM10 4C6.69 4 4 6.69 4 10C4 11.19 4.38 12.3 5.04 13.22L4.5 15.5L6.89 15.07C7.75 15.64 8.83 16 10 16C13.31 16 16 13.31 16 10C16 6.69 13.31 4 10 4ZM8.5 8H11.5V9.5H8.5V8ZM8.5 11H11.5V12.5H8.5V11Z" />
            </svg>
            AI
          </button>
          {!hideDebugMenu && (
            <button
              className="tool-button"
              onClick={() => setShowDebugTools(!showDebugTools)}
              title="Toggle Debug Tools"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3C10.5523 3 11 3.44772 11 4V5.06152C11.5237 5.18719 12.0248 5.38548 12.4904 5.6499L13.5355 4.60482C13.9261 4.2143 14.5592 4.2143 14.9497 4.60482L15.3952 5.05025C15.7857 5.44077 15.7857 6.07394 15.3952 6.46447L14.3501 7.50956C14.6145 7.97521 14.8128 8.47629 14.9385 9H15.9999C16.5522 9 16.9999 9.44772 16.9999 10C16.9999 10.5523 16.5522 11 15.9999 11H14.9385C14.8128 11.5237 14.6145 12.0248 14.3501 12.4904L15.3952 13.5355C15.7857 13.9261 15.7857 14.5592 15.3952 14.9497L14.9497 15.3952C14.5592 15.7857 13.9261 15.7857 13.5355 15.3952L12.4904 14.3501C12.0248 14.6145 11.5237 14.8128 11 14.9385V16C11 16.5523 10.5523 17 10 17C9.44772 17 9 16.5523 9 16V14.9385C8.47629 14.8128 7.97521 14.6145 7.50956 14.3501L6.46447 15.3952C6.07394 15.7857 5.44077 15.7857 5.05025 15.3952L4.60482 14.9497C4.2143 14.5592 4.2143 13.9261 4.60482 13.5355L5.6499 12.4904C5.38548 12.0248 5.18719 11.5237 5.06152 11H4C3.44772 11 3 10.5523 3 10C3 9.44772 3.44772 9 4 9H5.06152C5.18719 8.47629 5.38548 7.97521 5.6499 7.50956L4.60482 6.46447C4.2143 6.07394 4.2143 5.44077 4.60482 5.05025L5.05025 4.60482C5.44077 4.2143 6.07394 4.2143 6.46447 4.60482L7.50956 5.6499C7.97521 5.38548 8.47629 5.18719 9 5.06152V4C9 3.44772 9.44772 3 10 3ZM10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8Z" />
              </svg>
            </button>
          )}
          <div ref={onlineUsersRef} className="online-users-section" onClick={() => setShowOnlineUsers(prev => !prev)}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="7" r="3" />
              <path d="M10 11C6 11 3 13 3 15V17H17V15C17 13 14 11 10 11Z" />
            </svg>
            <span className="online-count" title={onlineUsers.map(u => u.userName).join('\n')}>
              {onlineUsers.length}
            </span>
            {showOnlineUsers && (
              <div className="online-users-widget">
                <h3>Online Users</h3>
                <ul>
                  {onlineUsers.map(user => (
                    <li key={user.userName}>
                      {user.userName}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="user-menu">
            <span className="username">{currentUser}</span>
            {currentUser.startsWith('Anon') ? (
              <>
                <button className="auth-button" onClick={() => { setShowAuthForm('login'); setAuthError(''); }}>Login</button>
                <button className="auth-button" onClick={() => { setShowAuthForm('signup'); setAuthError(''); }}>Signup</button>
              </>
            ) : (
              <button className="auth-button" onClick={handleLogout}>Logout</button>
            )}
          </div>
        </div>
      </div>

      {showAuthForm && (
        <div className="modal-overlay" onClick={() => setShowAuthForm(null)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{showAuthForm === 'login' ? 'Login' : 'Sign Up'}</h2>
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
            <div className="modal-actions">
              <button className="primary" onClick={showAuthForm === 'login' ? handleLogin : handleSignup}>
                {showAuthForm === 'login' ? 'Login' : 'Sign Up'}
              </button>
              <button className="secondary" onClick={() => setShowAuthForm(null)}>Cancel</button>
            </div>
            {authError && <p className="error-message">{authError}</p>}
          </div>
        </div>
      )}

      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-widget" onClick={(e) => e.stopPropagation()}>
            <h3>Keyboard Shortcuts</h3>
            <ul>
              <li><span>V</span> - Select Tool</li>
              <li><span>R</span> - Rectangle Tool</li>
              <li><span>O</span> - Circle Tool</li>
              <li><span>T</span> - Text Tool</li>
              <li><span>M</span> - Move Selected Shape</li>
              <li><span>Esc</span> - Exit current tool/mode</li>
            </ul>
            <div className="help-reminder">
              <strong>Reminder:</strong> You must select a shape before you can move or resize it.
            </div>
            <button onClick={() => setShowHelp(false)}>Got it</button>
          </div>
        </div>
      )}

      {aiWidgetExpanded && (
        <div className="ai-widget-panel">
          <div className="ai-widget-header">
            <h3>AI Assistant</h3>
            <button className="close-button" onClick={() => setAiWidgetExpanded(false)} title="Close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="ai-widget-content">
            <form onSubmit={handleAIChatSubmit} className="ai-form">
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask AI to create shapes, arrange elements, or modify your design..."
                disabled={aiIsLoading}
                rows={3}
              />
              <div className="ai-form-actions">
                <select value={aiModel} onChange={e => setAiModel(e.target.value)} disabled={aiIsLoading}>
                  <option value="gpt-4o">GPT-4o (Fast)</option>
                  <option value="gpt-5">GPT-5 (Advanced)</option>
                </select>
                <button type="submit" disabled={aiIsLoading} className="send-button">
                  {aiIsLoading ? 'Thinking...' : 'Send'}
                </button>
              </div>
            </form>
            {aiMessage && (
              <div className="ai-response">
                <strong>AI:</strong> {aiMessage}
              </div>
            )}
          </div>
        </div>
      )}
      {!hideDebugMenu && showDebugTools && (
        <div className="ai-widget-panel" style={{ bottom: '10px', right: 'auto', left: '10px', top: 'auto' }}>
          <div className="ai-widget-header">
            <h3>Debug Tools</h3>
            <button className="close-button" onClick={() => setShowDebugTools(false)} title="Close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="ai-widget-content">
            <button onClick={handleResetData}>Reset Data</button>
          </div>
        </div>
      )}
      <div
        ref={canvasRef}
        className={`canvas-container ${activeTool ? 'shape-creation-mode' : ''}`}
        style={{
          '--grid-size': `${50 * zoom}px`,
          '--pan-x': `${pan.x}px`,
          '--pan-y': `${pan.y}px`,
          cursor: isMoveMode ? 'pointer' : (draggingShape ? 'grabbing' : undefined),
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
            const isSelectedByMe = shape.selectedBy.includes(currentUser);
            const isSelectedByOther = isSelected && !isSelectedByMe;

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
                    onMouseDown={(e) => handleShapeMouseDown(e, shape)}
                    className={`shape rectangle ${isSelected ? 'selected' : ''}`}
                    style={{
                      left: `${shape.x}px`,
                      top: `${shape.y}px`,
                      width: `${shape.width}px`,
                      height: `${shape.height}px`,
                      cursor: isSelectedByMe ? 'grab' : (isSelectedByOther && activeTool === 'select' ? 'not-allowed' : undefined),
                    }}
                  />
                  {shape.selectedBy.includes(currentUser) && (
                    <div
                      className="selection-box"
                      style={{
                        left: `${shape.x}px`,
                        top: `${shape.y}px`,
                        width: `${shape.width}px`,
                        height: `${shape.height}px`,
                      }}
                    >
                      {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(handle => (
                        <div
                          key={handle}
                          className={`resize-handle ${handle}`}
                          onMouseDown={(e) => handleResizeMouseDown(e, shape, handle)}
                        />
                      ))}
                    </div>
                  )}
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
                    onMouseDown={(e) => handleShapeMouseDown(e, shape)}
                    className={`shape circle ${isSelected ? 'selected' : ''}`}
                    style={{
                      left: `${shape.x - shape.radius}px`,
                      top: `${shape.y - shape.radius}px`,
                      width: `${shape.radius * 2}px`,
                      height: `${shape.radius * 2}px`,
                      cursor: isSelectedByMe ? 'grab' : (isSelectedByOther && activeTool === 'select' ? 'not-allowed' : undefined),
                    }}
                  />
                  {shape.selectedBy.includes(currentUser) && (
                    <div
                      className="selection-box"
                      style={{
                        left: `${shape.x - shape.radius}px`,
                        top: `${shape.y - shape.radius}px`,
                        width: `${shape.radius * 2}px`,
                        height: `${shape.radius * 2}px`,
                      }}
                    >
                      {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(handle => (
                        <div
                          key={handle}
                          className={`resize-handle ${handle}`}
                          onMouseDown={(e) => handleResizeMouseDown(e, shape, handle)}
                        />
                      ))}
                    </div>
                  )}
                </Fragment>
              );
            }
            if (shape.type === 'text') {
              const isEditing = editingShapeId === shape.id;
              return (
                <Fragment key={shape.id}>
                  {isSelected && !isEditing && (
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
                  {isEditing ? (
                    <textarea
                      value={shape.text}
                      onChange={(e) => {
                        const newText = e.target.value;
                        setShapes(prevShapes => prevShapes.map(s =>
                          s.id === shape.id ? { ...s, text: newText } : s
                        ));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          finishEditing();
                        }
                      }}
                      onBlur={finishEditing}
                      autoFocus
                      style={{
                        position: 'absolute',
                        left: `${shape.x}px`,
                        top: `${shape.y}px`,
                        width: `${shape.width}px`,
                        height: `${shape.height}px`,
                        border: '1px solid #007bff',
                        zIndex: 1000,
                        font: 'inherit',
                        padding: '5px',
                        boxSizing: 'border-box',
                      }}
                    />
                  ) : (
                    <div
                      onMouseDown={(e) => handleShapeMouseDown(e, shape)}
                      className={`text ${isSelected ? 'selected' : ''}`}
                      style={{
                        position: 'absolute',
                        left: `${shape.x}px`,
                        top: `${shape.y}px`,
                        width: `${shape.width}px`,
                        height: `${shape.height}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isSelectedByMe ? 'grab' : (isSelectedByOther && activeTool === 'select' ? 'not-allowed' : undefined),
                      }}
                      onDoubleClick={() => !isSelectedByOther && setEditingShapeId(shape.id)}
                    >
                      {shape.text}
                    </div>
                  )}
                  {shape.selectedBy.includes(currentUser) && !isEditing && (
                    <div
                      className="selection-box"
                      style={{
                        left: `${shape.x}px`,
                        top: `${shape.y}px`,
                        width: `${shape.width}px`,
                        height: `${shape.height}px`,
                      }}
                    >
                      {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(handle => (
                        <div
                          key={handle}
                          className={`resize-handle ${handle}`}
                          onMouseDown={(e) => handleResizeMouseDown(e, shape, handle)}
                        />
                      ))}
                    </div>
                  )}
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
