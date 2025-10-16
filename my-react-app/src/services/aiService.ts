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
  console.log('Sending AI message (mocked):', request.message);

  // Mocked response for "add two rectangle to the canvas"
  if (request.message.toLowerCase().includes('add two rectangle')) {
    return Promise.resolve({
      message: "I've added two rectangles to the canvas for you.",
      commands: [
        {
          action: 'createShape',
          params: {
            type: 'rectangle',
            x: 100,
            y: 100,
          }
        },
        {
          action: 'createShape',
          params: {
            type: 'rectangle',
            x: 400,
            y: 100,
          }
        }
      ],
      reasoning: "User asked to create two rectangles. I've placed them at arbitrary positions."
    });
  }

  // Default mock response
  return Promise.resolve({
    message: "Sorry, I can only add two rectangles for now.",
    commands: [],
  });
};
