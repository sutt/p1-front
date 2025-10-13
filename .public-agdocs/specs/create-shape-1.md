In DemoFigma, implement shape creation buttons:
- When you click "Rectangle" or "Circle" the following will happen:
    - cursor will change to finger pointer when over the canvas to indicate it is waiting for a coord selection.
    - await a click on the canvas, and create the shape at the spot on the user clicks. 
    - create the shape with radius or (width, length) sampled randomly from (100,300) as an integer.
    - to create the shape:
        - add it to the data structure
        - make sure it renders on the canvas.
- Refactor the menu display:
    - move the buttons "Rectangle" and "Circle" down to their own row in the tools section and add a span to the right of them for hint text.