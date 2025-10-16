export interface AICommand {
  action: string; // 'createShape', 'moveShape', 'resizeShape', etc.
  params: Record<string, any>;
}

export interface AIRequest {
  user: string;
  message: string;
  canvasState: {
    shapes: any[]; // Using any to avoid type duplication for this PoC
    viewport: { zoom: number; pan: { x: number; y: number } };
  };
}

export interface AIResponse {
  message: string; // AI's text response
  commands: AICommand[]; // Structured commands to execute
  reasoning?: string; // Optional explanation
}

export const sendAIMessage = async (request: AIRequest): Promise<AIResponse> => {
  // MANUAL INTERVENTION: The VITE_API_URL environment variable should be set in `my-react-app/.env`
  // e.g. VITE_API_URL=http://127.0.0.1:8000/api
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const response = await fetch(`${apiUrl}/ai/chat`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    // Try to parse error response from backend
    const errorData = await response.json().catch(() => null);
    if (errorData && errorData.message) {
      throw new Error(`AI request failed: ${errorData.message}`);
    }
    throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};
