for the /api/ai/chat endpoint and logic allow multiple models to be requested by the client and dispatched by the backend service. 
- currently we're targeting {"gpt-4o", "gpt-5"} but this could change.
- create a toggle button next to the ai-chat-widget which has a dropdown box which will have two starter values:
    - display: "fast / simple"  | value: "gpt-4o"
    - display: "slow / complex" | value: "gpt-5"

### diff in api schema

           },
           "canvasState": {
             "$ref": "#/components/schemas/AICanvasState"
+          },
+          "model": {
+            "anyOf": [
+              {
+                "type": "string"
+              },
+              {
+                "type": "null"
+              }
+            ],
+            "title": "Model",
+            "description": "The AI model to use for the request"
           }
         },
         "type": "object",