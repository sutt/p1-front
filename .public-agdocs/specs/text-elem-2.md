fix the text element implementation for the following descriptions:
- Create the text element as a transparent container (instead of filling it with color + border), is can still have x,y,height, width underlying the element, just it won't show as filled shape.
- Problem: Adjust the text editing action to reflect the following problem: when the element is double clicked the text is able to be edited but hitting "enter" or clicking outside the shape does not work to accept the edits because the canvas reacts to lay down a new shape.
- Desired Solutions:
    - If "select mode" or the circle, rect, text buttons are "activated" then turn off their default behavior for the clicking on the canvas while the text elem text is being edited. you don't have to turn off the activation, only allow the user to accept the edited text by clicking outside that text elem.
    - Allow hitting "enter" on text edit to accept the edit and exit the edit mode.