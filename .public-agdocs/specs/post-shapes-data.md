Add an xhr post request which updates the values for "/shapes". This request will pass:
 - data: the full shapes array 
 - user: the currentUser from the client 

For example:
request:
{
    user: str,  # should be `currentUser` e.g. "User2"
    data: Shapes[] # e.g. [Shape(id='rect1', type='rectangle', x=100, y=100, width=300, height=200, selectedBy=[]),Shape(id='circ1', type='circle', x=600, y=400, radius=100, selectedBy=['User2']),]
}

This xhr should fire under the following conditions:
- shape added
- shape moved
- shape selection modified for currentUser
Add a debugging statement for this kickoff action and console log the shapes data structure being sent