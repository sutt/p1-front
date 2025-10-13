In DemoFigma remove the hello world placeholder nad replace with the scaffold of a complex SPA app we're going to build, which will be a basic clone/skin of figma functionality:

Page Layout:
- Add a menu section at the top which will be a placeholder for later functionality.
- Add a tools section at the top which will be used to:
    - 1) control naviagation within the page (zoom in/zoom-out) and 
    - 2.) to add shapes to the canvas. For now create the buttons but don't implement the functionality. Allow it to create a rectangle and circle shape
- Add a full page canvas section that has full panning and zoom in/out capabilities.
    

Functionality:
- Create a global coordinate system for the canvas
    - create a temp debugging functionality that will print out the x,y coord of the canvas coords where the user mouse clicks.
- For all console log activity turn it on/off with a module wide variable DEBUG 
- add a temp debugging functionality that prints when the user zooms or pans the canvas about the view / zoom state of the canvas.

Guidance:
- keep this as vanilla as possible without additional dependencies.