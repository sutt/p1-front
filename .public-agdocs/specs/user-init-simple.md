In DemoFigma implement a way to:
- initalize a unique currentUser ("AnonUser")
- allow the user to modify the currentUser to their preference ("UserSetUser")

## Controls
Add a new row of controls between menu and tools called "users".
- this is between the "GetData"/ "reset Data" row and "Zoom In" "Zoom out" row.
Users Controls:
- Display the currentUser name
- Add a button to "Set User" which when clicked, creates a text box which allows the user to type a username (max 20 chars).
- Add a button to "Anon User" that generates an AnonUser style user and sets the currentUser to it
- Add a placeholder for "users online" which will display an array of user names (don't need to implement yet, just a placeholder)

## Logic
- When the user set a userName is should save that username to localstorage
    - if the user clicks "Anon User" this should erase the saved username from localstorage
- When the app loads, it should check localstorage for a saved username and if found set the username / currentUser to value found
- when the username is changed in the controls this should update the app logic with currentUser and any cascading changes like shape selection property
- To generate a  AnonUser (if no username set by user or found on localstorage) it should take the form: "AnonXXXX" where "XXXX" are randomly generated digits.