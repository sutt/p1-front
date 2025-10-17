prevent the multiple users from selecting the same shape.
note: even though selectedBy is an array, this is because legacy reasons and we will only allow one string item in them by this update.

- ui updates: 
    - have cursor show a non-possible action when in select-mode and hovering over the shape
    - add any updates to ui actions or ui validations

- model / controller updates:
    - update any nec logic with the sync logic
    - revise comments in the code or add comments where appropriate to explain to other devs what this rule impacts