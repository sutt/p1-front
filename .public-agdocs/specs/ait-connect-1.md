Take the existing integration for mock ai-chat-widget and connect it to the backend API.
- eliminate code flows which hit the mocks, allow arbitrary commands to be run from the frontend up to the backend.
- add comments "MANUAL INTERVENTION: ..." for any extra steps that might need to be integrated by other developers.

Extra info:
- use guidance from docs/aitool-plan.md
- below there is an example request-response from the current backend implementation
- below there is a full openapi schema of the backend api


## Example Request / Response from the server:

### Request

{
  "user": "abc",
  "message": "add three rectangles and two circles",
  "canvasState": {
    "shapes": [
      {
        "id": "string",
        "type": "string",
        "x": 0,
        "y": 0,
        "width": 0,
        "height": 0,
        "radius": 0,
        "text": "string",
        "selectedBy": []
      }
    ],
    "viewport": {
      "zoom": 1,
      "pan": {
        "x": 0,
        "y": 0
      }
    }
  }
}

### Response

{
  "message": "I've processed your request.",
  "commands": [
    {
      "action": "createShape",
      "params": {
        "type": "rectangle",
        "x": 100,
        "y": 100,
        "width": 50,
        "height": 50
      }
    },
    {
      "action": "createShape",
      "params": {
        "type": "rectangle",
        "x": 200,
        "y": 100,
        "width": 50,
        "height": 50
      }
    },
    {
      "action": "createShape",
      "params": {
        "type": "rectangle",
        "x": 300,
        "y": 100,
        "width": 50,
        "height": 50
      }
    },
    {
      "action": "createShape",
      "params": {
        "type": "circle",
        "x": 400,
        "y": 100,
        "radius": 25
      }
    },
    {
      "action": "createShape",
      "params": {
        "type": "circle",
        "x": 500,
        "y": 100,
        "radius": 25
      }
    }
  ],
  "reasoning": null
}

## Backend API Schema

{
  "openapi": "3.1.0",
  "info": {
    "title": "FastAPI",
    "version": "0.1.0"
  },
  "paths": {
    "/api/ai/chat": {
      "post": {
        "tags": [
          "AI"
        ],
        "summary": "Ai Chat",
        "description": "Process natural language commands for canvas manipulation.\n\nFlow:\n1. Validate input (message length, rate limits)\n2. Call OpenAI with function calling\n3. Parse and validate AI-generated commands\n4. Return commands for frontend execution\n\nLIMITATIONS:\n- No authentication in PoC (uncomment current_user for production)\n- Single retry on validation failure (not iterative refinement)\n- No conversation history tracking\n- Commands are validated but not executed by backend\n- Frontend must handle command execution and sync\n\nArgs:\n    request: AI chat request with user message and canvas state\n    db: Database session\n\nReturns:\n    AIChatResponse with AI message and structured commands\n\nRaises:\n    HTTPException: On rate limit exceeded or processing errors",
        "operationId": "ai_chat_api_ai_chat_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AIChatRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AIChatResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/login": {
      "post": {
        "summary": "Login For Access Token",
        "description": "Logs in a user and returns an access token.\nAfter successful login, the frontend should redirect to the /canvas route.",
        "operationId": "login_for_access_token_api_login_post",
        "requestBody": {
          "content": {
            "application/x-www-form-urlencoded": {
              "schema": {
                "$ref": "#/components/schemas/Body_login_for_access_token_api_login_post"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Token"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/signup": {
      "post": {
        "summary": "Signup",
        "description": "Creates a new user.",
        "operationId": "signup_api_signup_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UserCreate"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/me": {
      "get": {
        "summary": "Read Users Me",
        "description": "Returns the current user's username.",
        "operationId": "read_users_me_api_me_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UserResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "OAuth2PasswordBearer": []
          }
        ]
      }
    },
    "/api/shapes": {
      "get": {
        "summary": "Get Shapes",
        "description": "Returns the list of shapes.",
        "operationId": "get_shapes_api_shapes_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create Or Update Shapes",
        "description": "Creates new shapes or updates existing ones from the provided list.",
        "operationId": "create_or_update_shapes_api_shapes_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ShapesUpdateRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/user_online": {
      "get": {
        "summary": "Get Online Users",
        "description": "Returns the list of currently online users.",
        "operationId": "get_online_users_api_user_online_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "items": {
                    "$ref": "#/components/schemas/UserOnlineResponse"
                  },
                  "type": "array",
                  "title": "Response Get Online Users Api User Online Get"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "User Heartbeat",
        "description": "Registers a user heartbeat and returns the list of currently online users.",
        "operationId": "user_heartbeat_api_user_online_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UserOnlineRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "items": {
                    "$ref": "#/components/schemas/UserOnlineResponse"
                  },
                  "type": "array",
                  "title": "Response User Heartbeat Api User Online Post"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/reset_data": {
      "post": {
        "summary": "Reset Data",
        "description": "Resets the shapes data to the initial seed data.",
        "operationId": "reset_data_api_reset_data_post",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {

                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "AICanvasState": {
        "properties": {
          "shapes": {
            "items": {
              "$ref": "#/components/schemas/routes__ai__ShapeModel"
            },
            "type": "array",
            "title": "Shapes"
          },
          "viewport": {
            "$ref": "#/components/schemas/CanvasViewport"
          }
        },
        "type": "object",
        "required": [
          "shapes",
          "viewport"
        ],
        "title": "AICanvasState",
        "description": "Canvas state sent from frontend."
      },
      "AIChatRequest": {
        "properties": {
          "user": {
            "type": "string",
            "title": "User",
            "description": "Username of the requester"
          },
          "message": {
            "type": "string",
            "maxLength": 500,
            "title": "Message",
            "description": "User's natural language command"
          },
          "canvasState": {
            "$ref": "#/components/schemas/AICanvasState"
          }
        },
        "type": "object",
        "required": [
          "user",
          "message",
          "canvasState"
        ],
        "title": "AIChatRequest",
        "description": "Request model for AI chat endpoint."
      },
      "AIChatResponse": {
        "properties": {
          "message": {
            "type": "string",
            "title": "Message",
            "description": "AI assistant's text response"
          },
          "commands": {
            "items": {
              "$ref": "#/components/schemas/AICommand"
            },
            "type": "array",
            "title": "Commands",
            "description": "Structured commands to execute"
          },
          "reasoning": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Reasoning",
            "description": "Optional explanation of AI logic"
          }
        },
        "type": "object",
        "required": [
          "message"
        ],
        "title": "AIChatResponse",
        "description": "Response model for AI chat endpoint."
      },
      "AICommand": {
        "properties": {
          "action": {
            "type": "string",
            "title": "Action",
            "description": "Command type (createShape, moveShape, etc.)"
          },
          "params": {
            "additionalProperties": true,
            "type": "object",
            "title": "Params",
            "description": "Command parameters"
          }
        },
        "type": "object",
        "required": [
          "action",
          "params"
        ],
        "title": "AICommand",
        "description": "Structured command returned by AI for frontend execution."
      },
      "Body_login_for_access_token_api_login_post": {
        "properties": {
          "grant_type": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^password$"
              },
              {
                "type": "null"
              }
            ],
            "title": "Grant Type"
          },
          "username": {
            "type": "string",
            "title": "Username"
          },
          "password": {
            "type": "string",
            "format": "password",
            "title": "Password"
          },
          "scope": {
            "type": "string",
            "title": "Scope",
            "default": ""
          },
          "client_id": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Client Id"
          },
          "client_secret": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "format": "password",
            "title": "Client Secret"
          }
        },
        "type": "object",
        "required": [
          "username",
          "password"
        ],
        "title": "Body_login_for_access_token_api_login_post"
      },
      "CanvasViewport": {
        "properties": {
          "zoom": {
            "type": "number",
            "title": "Zoom",
            "default": 1
          },
          "pan": {
            "additionalProperties": {
              "type": "number"
            },
            "type": "object",
            "title": "Pan",
            "default": {
              "x": 0,
              "y": 0
            }
          }
        },
        "type": "object",
        "title": "CanvasViewport",
        "description": "Canvas viewport information (zoom and pan)."
      },
      "HTTPValidationError": {
        "properties": {
          "detail": {
            "items": {
              "$ref": "#/components/schemas/ValidationError"
            },
            "type": "array",
            "title": "Detail"
          }
        },
        "type": "object",
        "title": "HTTPValidationError"
      },
      "ShapesUpdateRequest": {
        "properties": {
          "user": {
            "type": "string",
            "title": "User"
          },
          "data": {
            "items": {
              "$ref": "#/components/schemas/main__ShapeModel"
            },
            "type": "array",
            "title": "Data"
          }
        },
        "type": "object",
        "required": [
          "user",
          "data"
        ],
        "title": "ShapesUpdateRequest"
      },
      "Token": {
        "properties": {
          "access_token": {
            "type": "string",
            "title": "Access Token"
          },
          "token_type": {
            "type": "string",
            "title": "Token Type"
          }
        },
        "type": "object",
        "required": [
          "access_token",
          "token_type"
        ],
        "title": "Token"
      },
      "UserCreate": {
        "properties": {
          "username": {
            "type": "string",
            "title": "Username"
          },
          "password": {
            "type": "string",
            "title": "Password"
          }
        },
        "type": "object",
        "required": [
          "username",
          "password"
        ],
        "title": "UserCreate"
      },
      "UserOnlineRequest": {
        "properties": {
          "userName": {
            "type": "string",
            "title": "Username"
          }
        },
        "type": "object",
        "required": [
          "userName"
        ],
        "title": "UserOnlineRequest"
      },
      "UserOnlineResponse": {
        "properties": {
          "userName": {
            "type": "string",
            "title": "Username"
          },
          "created_at": {
            "type": "string",
            "format": "date-time",
            "title": "Created At"
          }
        },
        "type": "object",
        "required": [
          "userName",
          "created_at"
        ],
        "title": "UserOnlineResponse"
      },
      "UserResponse": {
        "properties": {
          "username": {
            "type": "string",
            "title": "Username"
          }
        },
        "type": "object",
        "required": [
          "username"
        ],
        "title": "UserResponse"
      },
      "ValidationError": {
        "properties": {
          "loc": {
            "items": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "integer"
                }
              ]
            },
            "type": "array",
            "title": "Location"
          },
          "msg": {
            "type": "string",
            "title": "Message"
          },
          "type": {
            "type": "string",
            "title": "Error Type"
          }
        },
        "type": "object",
        "required": [
          "loc",
          "msg",
          "type"
        ],
        "title": "ValidationError"
      },
      "main__ShapeModel": {
        "properties": {
          "id": {
            "type": "string",
            "title": "Id"
          },
          "type": {
            "type": "string",
            "title": "Type"
          },
          "x": {
            "type": "integer",
            "title": "X"
          },
          "y": {
            "type": "integer",
            "title": "Y"
          },
          "width": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Width"
          },
          "height": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Height"
          },
          "radius": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Radius"
          },
          "text": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Text"
          },
          "selectedBy": {
            "items": {
              "type": "string"
            },
            "type": "array",
            "title": "Selectedby",
            "default": []
          }
        },
        "type": "object",
        "required": [
          "id",
          "type",
          "x",
          "y"
        ],
        "title": "ShapeModel"
      },
      "routes__ai__ShapeModel": {
        "properties": {
          "id": {
            "type": "string",
            "title": "Id"
          },
          "type": {
            "type": "string",
            "title": "Type"
          },
          "x": {
            "type": "integer",
            "title": "X"
          },
          "y": {
            "type": "integer",
            "title": "Y"
          },
          "width": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Width"
          },
          "height": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Height"
          },
          "radius": {
            "anyOf": [
              {
                "type": "integer"
              },
              {
                "type": "null"
              }
            ],
            "title": "Radius"
          },
          "text": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Text"
          },
          "selectedBy": {
            "items": {
              "type": "string"
            },
            "type": "array",
            "title": "Selectedby",
            "default": []
          }
        },
        "type": "object",
        "required": [
          "id",
          "type",
          "x",
          "y"
        ],
        "title": "ShapeModel",
        "description": "Shape model matching the existing Shape model in main.py."
      }
    },
    "securitySchemes": {
      "OAuth2PasswordBearer": {
        "type": "oauth2",
        "flows": {
          "password": {
            "scopes": {

            },
            "tokenUrl": "/api/login"
          }
        }
      }
    }
  }
}