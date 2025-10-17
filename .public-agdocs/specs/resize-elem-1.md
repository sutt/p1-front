Implement a resize action to all shapes (rect, circle, text)
Recommended implementation guidelines:
- on shape selection, generate an outline bounding box around the shape demonstrating to the user that these are ui-elements which can be selected for resize. 
- allow different actions on selected shape:
    - when cursor is hovering over bounding box resize, have the cursor render
    - when cursor is hovering over the middle of the shape keep the cursor in grab-hand mode to enable drag-and-drop shape-move.
    - when the shape is a text elem, keep the ability to double click to edit (don't change exisiting behavior here) but still allow the text shape to be resized.
- follow the pattern seen in text editing where the local state on the editing user's canvas immediately assumes the updated state and is not temporarily invalidated by sync with server state