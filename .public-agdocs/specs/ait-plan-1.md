### Task
We want to implement a new feature to allow an ai-powered chat widget in the frontend which will allow the user to type a command which will manipulate the canvas, e.g. adding shapes, moving shapes or resizing shapes. This likely should utilize a function-calling request to openai's api.

Sketch out the architecture and add it to docs/aitool-plan.md. 
- identify what should be handled on frontend vs backend
- identify any frontend code thats needs to be updated or added
- identify any concerns

Extra info provided:
- information about manipulating objects on canvas given the collab syncing architecture.
- features guidelines for PM, some examples of what should be done.
- an openapi schema from the backend


### Collab Arch, corner cases
Note: this multi-user collab architecture allows only 1 user to , so don't manipulate objects which are currently selected 



### Feature guidlelines from PM

AI Canvas Agent
The AI Feature
Build an AI agent that manipulates your canvas through natural language using function calling.

When a user types “Create a blue rectangle in the center,” the AI agent calls your canvas API functions, and the rectangle appears on everyone’s canvas via real-time sync.
Required Capabilities
Your AI agent must support at least 6 distinct commands showing a range of creation, manipulation, and layout actions.
Creation Commands:

“Create a red circle at position 100, 200”
“Add a text layer that says ‘Hello World’”
“Make a 200x300 rectangle”
Manipulation Commands:

“Move the blue rectangle to the center”
“Resize the circle to be twice as big”
“Rotate the text 45 degrees”
Layout Commands:

“Arrange these shapes in a horizontal row”
“Create a grid of 3x3 squares”
“Space these elements evenly”
Complex Commands:

“Create a login form with username and password fields”
“Build a navigation bar with 4 menu items”
“Make a card layout with title, image, and description”
Example Evaluation Criteria
When you say:

“Create a login form,” …We expect the AI to create at least three inputs (username, password, submit), arranged neatly, not just a text box.
Technical Implementation
Define a tool schema that your AI can call, such as:

createShape(type, x, y, width, height, color)
moveShape(shapeId, x, y)
resizeShape(shapeId, width, height)
rotateShape(shapeId, degrees)
createText(text, x, y, fontSize, color)
getCanvasState() // returns current canvas objects for context

We recommend OpenAI’s function calling or LangChain tools for interpretation.
For complex operations (e.g. “create a login form”), your AI should plan steps upfront (create fields, align, group) and execute sequentially.
Shared AI State

### backend api schema:
{
  "openapi": "3.1.0",
  "info": {
    "title": "FastAPI",
    "version": "0.1.0"
  },
  "paths": {
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
      "ShapeModel": {
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
      "ShapesUpdateRequest": {
        "properties": {
          "user": {
            "type": "string",
            "title": "User"
          },
          "data": {
            "items": {
              "$ref": "#/components/schemas/ShapeModel"
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