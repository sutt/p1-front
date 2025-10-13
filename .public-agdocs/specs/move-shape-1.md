In DemoFigma, implement a move shape functionality:

Add a tool button next to "select mode" called "Move Shape":
- the button will have an active / dis-active visible status (like "select mode" has), which will impact the behavior of clicking the canvas when it's active.
- the button should be visibly dis-abled (not able to even click or activate it) when the current user does not have shape selected (add this to a hover-over tool tip message when it's diabled)

If the currentUser has an shape selected and move-shape mode is enabled then reposition the shape (update data + rendering) to it's new x,y coords.
- the following are not updated: height, width, radius, shapeType, id, and selectedBy
- once the shape has been moved, disable the move-shape mode, dis-activating the button (not disabling it).


Add state hints about to hint span section (currently it looks like this<span>Click on the canvas to place a {currentTool}</span>):
- If you are in Select mode log that to hints
- If current user does/ does not have a shape selected add that to the message.
- If you are in "Move Shape" mode, add this to the message telling the user it's awaiting the new position for the selected shape.
- If move shape action has completed, log that it has occured and move-shape mode is deactivated.