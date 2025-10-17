In DemoFigma,
Update the logic in fetchShapes() to use the same logic used by updateShapesOnServer(). Specifically we want to make sure a response from the server on the state of shapes doesn't override the updates made by in the localState. 

There appears to be a "jitter" to the UX in the case where:
- outgoing fetchShapes request goes out
- client side user adds a shape "NewShape", 
    - "NewShape" immediately renders to screen
    - this kicks off an UpdateShapesOnServer request...
- fetchShapes response returns with the server state which doesn't include the newly added shape "NewShape" yet (since UpdateShapesOnServer hasn't arrived), 
    - now this stale state renders which removes "NewShape" from being rendered.
- finally UpdateShapesOnServer() is processed on server including NewShape on server state, and then the original user sends another fetchShapes() polling request and receives response which noe includes NewShape which re-renders the NewShape.

Feel free to update logic not just in fetchShapes but in other parts of the code as well.

### Logic to handle
- handle initial page load where the user doesn't have any state changes, so should just accept the state from the 
- polling occurs every 2000ms

### Note bene on application logic
- There is no delete functionality, execpt for reset_data button which refreshes the state on the server, which on polling it should override the local state.
- The things that a user can change on state:
    - his own shape selection property (but not for other users) 
        - user can select at most 1 shape, and can also select 0 shapes.
    - shape move (change of x,y coords) of 0,1, or many shapes
    - shape add (0,1, or many shapes)
