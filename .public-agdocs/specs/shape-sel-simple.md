In DemoFigma, 
extend the shapes datastructure and rendering to enable a selection / cursor property.
This property should be an array or other collection type which allows none or multiple entries for which users / user_ids have selected that shape.
Current assume there is one user "User1"

Menu refactor: Add a button "Select Mode" which will toggle active/in-active (this should be visually apparent). This button goes on the top row of tools, next to "Pan Right".
- When active the this will await the user for clicking on the canvas and if the point they click is contained within a shape, that shapes selected property should now have "User1" in the selection property, and all other shapes should have their selected property for User1 moved to false. If "select mode" is active and the user selects a shape already selected by him, that shapes loses the selected property for the user.
- When the button is not active, clicking on the canvas of a shape does not select the shape.

- For rendering: 
    - modify the way the shape looks by making it it's border / fill etc slightly more pronounced.
    - You should render a tooltip-like modal (but that's always visible when the shape if selected) to the topleft of the selected shape which displays the user names (e.g."User1") for now, and remove that modal when shape is un-selected by all users.


