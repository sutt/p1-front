In DemoFigma update the tools section wiht the following changes:

- For 1st top row, the Menu row ("Get data", "Reset Data", etc): move these elements inside a by default collapsed section which has a checkbox outside the collapsed section (by default unchecked) that says "Enable Debug Tools" which when check opens the collapsed section.
- For the 3rd row ("Zoom In" ... "Move Shape") 
- move the rightmost two buttons ("Select Mode" and "Move Shape") down to a new line below. Add a label to this new row "Selection Tools: "

- For the bottom row ("Rectangle" "Circle") update the both button's logic to follow the persist activation state logic that "Select Mode" button:
    - Add a label to this row "Shape Tools: "
    - when clicked they visually display with fill or other ui elements to show they are active untill they are clicked again to show they are deactivated.
    - When rectangle is clicked, clicking should create a rectangle each time without having to re-activate this
        - (this applied to both rect and circle) 
    - Three buttons ("Rectangle", "Circle", "Select Mode") have persist-activation mode and they active state is mutually exclusive in that at-most only one can be active (none can be active as well). Clicking another button that is not active should de-activate the button that is active (if any)
