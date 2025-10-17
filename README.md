# GauntletAI - P1 | Milestone1 | DevLog

_Will Sutton | October 17, 2025_

**Deployed here:** https://gauntlet.lightningcloud.dev/canvas

**Milestone2 Video here:** https://www.youtube.com/watch?v=YdiLi4gJq94

**Milestone1 Video here:** https://www.youtube.com/watch?v=iOHIRxB-qNA

**Backend Repo:** https://github.com/sutt/p1-back

---

## Tools & Workflow: 
Used **Agro** which runs ClaudeCode / Gemini-CLI / Aider  CLI-coders as background agents that spit out results to git worktrees. Each prompt is run 2-3 times, and after manual comparison a winner is accepted or the prompt is revised. So each commit is the result of one prompt. More on this below.

**Milestone2 update:** I began implementing more one-off ClaudeCode interactive session for small fixes and developing planning docs.

*Note bene: I want to learn to Cursor badly which is why I'm in the course, but what I went with what I know how to wield to hit the first deadline.*

## Prompting Strategies: 

*All my prompts are available as markdowns here: [Public Specs](./.public-agdocs/specs/)*

I began using the **planning pattern** we're learning during this milestone for the AI-Chat feature, where we start by developing a markdown files of architectural and task considerations, see [frontend plan](./docs/aitool-plan.md) and [backend plan](https://github.com/sutt/p1-back/blob/master/docs/aitool-plan.md). Since these are separate repos I was copying and paste the plan between the repos.

My most significant frontend prompt was to revamp the UI from a prototype to a pleasant UI one I needed to. I built out five separate mockups with agents and selected my favorite, with `Sonnet-4.1` delivering the winner here, even though 90% of my accepted code comes from `Gemini-2.5-Pro`.

Overall there were three phases to the development this milestone:
- **AI-Chat-Tool:** *ait-plan-1.md, ait-impl-1.md, ait-connect-1.md, multimodel-ai.md*
- **UI-Revamp:** *ui-pretty-1.md, ui-fullscreen-1.md, online-wdget.md, reset-data-button.md, key-shortcut.md*
- **Add-Map-to-Canvas:** *plan-map-1.md, map-start-1.md, map-start-pan.md, map-pan-fix.md, map-toggle-widget.md, map-coord-widget.md*

The other prompt I'm proud of was on the backend for building the service call to OpenAI's API. The planning document really seemed to help get context from the frontend into agents working on the backend like `ai-impl-1.md`. One thing that seemed to work out well is when implementing a new feature, to insturct the AI to leave a ton of comments explaining limitations and control knobs in the code. All the prompts for backend are available [here](https://github.com/sutt/p1-back/tree/master/.public-agdocs/specs).

Finally I did some manual editing to the meta-prompt for the AI widget which seemed to improve its performance somewhat on complex queries:

```diff
index cbc30f8..ea8de68 100644
--- a/services/openai_service.py
+++ b/services/openai_service.py
@@ -257,7 +257,8 @@ class OpenAIService:
 
 CANVAS DETAILS:
 - Coordinate system: Top-left is (0,0), X increases right, Y increases down
-- Typical viewport: 800x600 pixels
+- Typical viewport: 800x600 pixels at zoom=1.0
+- use canvasState.viewport.{x,y} state to understand where the user is currently viewing. This can can ran
 - Shape types: rectangle, circle, text
 
 CRITICAL RULES:
@@ -271,6 +272,10 @@ CANVAS STATE:
 You will receive the current canvas state including all shapes and their properties.
 Use findShapes to locate shapes when IDs are not explicitly mentioned.
 
+SPECIAL INSTRUCTIONS:
+When asked to create shapes use the canvasState.viewport.(x, y) to understand where the current user if looking and add the shapes to that area in what manner was requested.
+When asked to create non-trivial layouts (e.g. re-create a logo or mockup) lay those out 100 - 200 points away from exisiting shapes.
+
```

I show these prompts and dicuss them in more detail below in [Best Prompt Detail](#best-prompt-details).

#### milestone1 prompts

And you can see a nice summary of prompt summaries and the linked code they generated below in [DevLog](#devlog).

The most useful and creative prompts:
- **`fix-jitter-1`** (*frontend*) - This was the standout for me since it displayed **strong reasoning** to fix the cursor-sync logic. I laboriously wrote up a prompt of the error condition I suspected was causing it, and the AI pumped out a perfect fix.
- **`poll-heartbeat-1`** (*frontend*) - This was a creative prompt which used the Swagger/OpenAPI generated schema (comes with FastAPI) on the backend to write the frontend requests correctly. This saves time when writing the prompt and **shows how to add context** from backend to frontend.
- **`user-heartbeat-1`** (*backend*) - This was a helpful prompt since it generated thread-safe in-memory data store for my async routes which I did not know how to write myself. As I generated the solution, I realized my specifications could be optimized (no need to do two separate request of POST to let server know user is online and then GET to find out from server how many other users are online) so I was able to **comfortably "throw away" my first generations** and then re-generate quickly with the revised logic. 

I show these prompts and dicuss them in more detail below in [Best Prompt Detail](#best-prompt-details)

## Code Analysis: 

AI-generated code is likely > 98% by lines and 90% by commits. The code has become more modularized. As I got rid of some of my early debugging tools, using typescript forced me to delete code via `unused-var` build errors.

#### milestone1

90 - 95% of code is AI generated, 80-90% of commits are AI generated (manual commits are small one offs so they don't account for many lines).

Any commit marked "`manual: ...`" is a manual commit. Pretty much the rest are AI generated, with commit messages written by AI.

Most of my frontend code stayed in one module `DemoFigma.tsx` and `DemoFigma.css`. My backend was also pretty flat with most the setup and request logic staying in `main.py` where I would usually split this out into deeply nested modules.

## Strengths & Limitations: 

I was impressed with AI's perf for this project. There wasn't any prompt it failed once the prompt was well crafted. That being said here's some caveats: 
- Not defensive enough: e.g. it didn't anticipate shape coords coming in as decimals and so had validation errors when trying to write to int DB fiedlds. **Milestone2 Update:** No longer the case, the AI wrote a great module called `ai_validator.py` which checked each tool call from OpenAI against known methods in the frontend, it can be viewed [here](https://github.com/sutt/p1-back/blob/master/services/ai_validator.py).
- Amateur structure for backend: a very flat structure develop in the python server with too much logic going into `main.py`. **Milestone2 Update:** no longer the case!
- I felt like my frontend prompts were too verbose to specify certain areas / buttons, etc to ask it to change. **Milestone2 Update:** after refactoring the UI, there was less need to be very specific with what I ws looking for since the UI was arranged canonically.


## Key Learnings: 
AI is able to pick up what you want not just from your prompt and your guidance files, but from looking at the patterns used in the surrounding code. When I had AI add debugging lines to one part of the code, it was easier to get that desired pattern to work on other prompts with much less instruction. So setting the right foundation is key as you build your code base.

Another thing I learned is that even though AI for frontend is very useful for me, I need better workflows, tools, and prompt strategy to quickly iterate on UI's as a I develop a project.


## DevLog:

I've created a table of all my prompts and associated commits below. If you click the links, they'll take you to files or views on GitHub. *(nota bene: this table generated by AI ofc)*

#### Frontend

*(not updated for milestone2)*

| Task File | Contents (truncated) | Accepted SHA | Non-test Diffs | Test Diffs | Notes |
|------|-------------|---------|-------------|------------|-----------|
| [hide-menu-debug.md](./.public-agdocs/specs/hide-menu-debug.md) | Create environment variable to conditionally hide the menu row of debug buttons (Get Data, Switch User, etc). | [dd8b224](https://github.com/sutt/p1-front/commit/dd8b224) | +20/-14 | +0/-0 | |
| [reset-data-button.md](./.public-agdocs/specs/reset-data-button.md) | Add "Reset Data" button next to "Get Data" in menu that calls server's /reset_data endpoint and immediately refreshes local canvas data. | [5aad229](https://github.com/sutt/p1-front/commit/5aad229) | +17/-0 | +0/-0 | |
| [get-before-update.md](./.public-agdocs/specs/get-before-update.md) | Modify updateShapesOnServer() to first fetch latest server data, merge client state with updated data, then send the combined result to server. | [0f4920a](https://github.com/sutt/p1-front/commit/0f4920a) | +28/-12 | +0/-0 | |
| [polling-simple.md](./.public-agdocs/specs/polling-simple.md) | Implement server polling to fetch updated shapes data from /shapes route with configurable interval via env var. | [a0a1eb3](https://github.com/sutt/p1-front/commit/a0a1eb3) | +8/-1 | +0/-0 | |
| [coords-toint.md](./.public-agdocs/specs/coords-toint.md) | Add validation step to convert shape coordinates (x,y,width,height,radius) to integers using rounding when creating or moving shapes. | [8cbc14e](https://github.com/sutt/p1-front/commit/8cbc14e) | +5/-5 | +0/-0 | |
| [post-shapes-data.md](./.public-agdocs/specs/post-shapes-data.md) | Add XHR POST to /shapes endpoint sending full shapes array and currentUser. Trigger on shape add/move/selection. Include debugging statements and console logging of data structure being sent. | [a1c5382](https://github.com/sutt/p1-front/commit/a1c5382) | +63/-24 | +0/-0 | |
| [server-getdata-1.md](./.public-agdocs/specs/server-getdata-1.md) | Connect to server at 127.0.0.1:8000/shapes (configurable via .env). Load shapes data on page load and add "Get Data" button to replace client data with server data. Log fetch errors. | [a1c69a6](https://github.com/sutt/p1-front/commit/a1c69a6) | +24/-4 | +0/-0 | |
| [move-shape-1.md](./.public-agdocs/specs/move-shape-1.md) | Implement move shape tool: Add "Move Shape" button (disabled when no selection), reposition selected shapes on canvas click, update state hints for select mode, selection status, move mode, and completion. | [c864f72](https://github.com/sutt/p1-front/commit/c864f72) | +74/-5 | +0/-0 | |
| [debug-btns-1.md](./.public-agdocs/specs/debug-btns-1.md) | Add temporary debug elements to menu: Display currentUser value, toggle button to switch between User1/User2, and "Print Shapes" button to console.log the full shapes data structure. | [b76c423](https://github.com/sutt/p1-front/commit/b76c423) | +10/-1 | +0/-0 | |
| [shape-sel-simple.md](./.public-agdocs/specs/shape-sel-simple.md) | Add shape selection system: Extend data structure with selectedBy array, add "Select Mode" toggle button, enable clicking shapes to select/deselect for User1, render selection with pronounced borders and user tooltip. | [c3d29ee](https://github.com/sutt/p1-front/commit/c3d29ee) | +135/-27 | +0/-0 | |
| [create-shape-1.md](./.public-agdocs/specs/create-shape-1.md) | Implement shape creation: Rectangle/Circle buttons change cursor over canvas, await click to create shape at location with random size (100-300px). Refactor menu to move shape buttons to separate row with hints. | [6697d88](https://github.com/sutt/p1-front/commit/6697d88) | +74/-16 | +0/-0 | |
| [render-shapes-1.md](./.public-agdocs/specs/render-shapes-1.md) | Implement shape rendering system: Create data structure for shape coordinates, render circles and rectangles on canvas. Hardcode initial shapes: rectangle at (100,100) and circle at (600,400). | [eb12696](https://github.com/sutt/p1-front/commit/eb12696) | +68/-1 | +0/-0 | |
| [basic-pan.md](./.public-agdocs/specs/basic-pan.md) | Implement pan functionality: Add directional pan buttons to tools section and enable mouse click-and-drag panning on canvas with debug coord logging. | [f593291](https://github.com/sutt/p1-front/commit/f593291) | +18/-4 | +0/-0 | |
| [fix-preventdefault.md](./.public-agdocs/specs/fix-preventdefault.md) | Fix console error "Unable to preventDefault inside passive event listener invocation" appearing in wheel event handling for zooming. | [ff1480f](https://github.com/sutt/p1-front/commit/ff1480f) | +13/-4 | +0/-0 | |
| [full-screen.md](./.public-agdocs/specs/full-screen.md) | [Empty file - no content] | n/a | | | |
| [layout-fixup.md](./.public-agdocs/specs/layout-fixup.md) | Restructure DemoFigma layout: Arrange menu and tools sections vertically with menu at top, tools below, both left-aligned for contents. | [9641aae](https://github.com/sutt/p1-front/commit/9641aae) | +3/-2 | +0/-0 | |
| [cvs-bg.md](./.public-agdocs/specs/cvs-bg.md) | Add responsive grid layout to canvas background that shows gridlines which scale dynamically based on zoom level. | [7d45490](https://github.com/sutt/p1-front/commit/7d45490) | +11/-1 | +0/-0 | |
| [scaffold-canvas.md](./.public-agdocs/specs/scaffold-canvas.md) | Replace hello world with Figma clone scaffold: Add menu section, tools for navigation/shapes, full-page canvas with pan/zoom. Create coordinate system with click debugging and zoom/pan state logging. Keep vanilla without deps. | [d41176c](https://github.com/sutt/p1-front/commit/d41176c) | +173/-2 | +0/-0 | |
| [simple-page.md](./.public-agdocs/specs/simple-page.md) | Create DemoFigma component with Hello World page accessible at /canvas route. Link component to main App/vite-starter page via router. | [b5d4d15](https://github.com/sutt/p1-front/commit/b5d4d15) | +32/-2 | +0/-0 | |


## Best Prompt Details

#### `ui-pretty-1`

One cool thing was even though I told it to ignore the ai widget for later, it ended up crafting a very nice AI widget form for me. Time back!

```markdown
update the ui of DemoFigma drastically to display as a modern ui.
- move around elements as you see fit
    - note: eventually signup and login forms will be moved out of in page into a pop-up modal
- no need to preserve the "Enable DEbug Tools" section
- fix the layout of the canvas to fill the screen below horizontally and to the the bottom, you can leave room at the top for tools and menus, make this responsive to handle a variety of 
- use icons to replace the words Rect, Cricle, Text buttons. Enable tool tip over these buttons to explain to the user what they do. 
- Slighlty refactor the ai-tool-widget, but we'll work on that one more in a later feature, so just get it to fit with the existing layout you produce. The ai widget should only display a button toggle open/close the full form and other ui elements for this feature.
```

#### `ait-impl-1`

You can see the the full solution delivered here: https://github.com/sutt/p1-back/commit/c4c2b5 .

```markdown
scaffold a basic proof-of-concept implementation laid out in docs/aitool-plan.md for the backend.

- add debug/print statements for this action controlled toggleable by an AI_DEBUG variable
- add comments describing the limitation of your approach or what will need to be added to extend beyond the basic concept
- add comments describing any manual intervention / addition, e.g. add env vars
```

#### `fix-jitter-1`

You can see the in-depth debugging explanation along with adding other assumptions for AI to go to work. 

This prompt was generated the most heterogenous solutions of any of them when it was run 4-5 different times for candidate solutions. Ultimately I went with a Goldilocks strategy of in-the-middle for complexity, and one where manual testing showed the problem was solved.

You can see the accepted solution here: https://github.com/sutt/p1-front/commit/43346017f8bccc28a6b9764449b62da51568c995

```markdown
There appears to be a "jitter" to the UX in the case where:
- outgoing fetchShapes request goes out
- client side user adds a shape "NewShape", 
    - "NewShape" immediately renders to screen
    - this kicks off an UpdateShapesOnServer request...
- fetchShapes response returns with the server state which doesn't include the newly added shape "NewShape" yet (since UpdateShapesOnServer hasn't arrived), 
    - now this stale state renders which removes "NewShape" from being rendered.
- finally UpdateShapesOnServer() is processed on server including NewShape on server state, and then the original user sends another fetchShapes() polling request and receives response which noe includes NewShape which re-renders the NewShape.

Feel free to update logic not just in fetchShapes but in other parts of the code as well.

### Logic to handle
- handle initial page load where the user doesn't have any state changes, so should just accept the state from the 
- polling occurs every 2000ms

### Note bene on application logic
- There is no delete functionality, execpt for reset_data button which refreshes the state on the server, which on polling it should override the local state.
- The things that a user can change on state:
    - his own shape selection property (but not for other users) 
        - user can select at most 1 shape, and can also select 0 shapes.
    - shape move (change of x,y coords) of 0,1, or many shapes
    - shape add (0,1, or many shapes)
```


#### `poll-heartbeat-1`

We can see at the bottom of the prompt where I copied in a (non-prettified) JSON of the full API schema generated by FastAPI.
 

```mdc
In DemoFigma, add polling to the the /api/user_online by doing a POST with the currentUser
- parameterize the polling interval, default to 5 seconds (add this to .env.example)
- don't use the GET route for now, only use the POST route.
- utilize the api schema below to undertand how to implement this

Add the response values into the "User Online" placeholder in the User Tools sections. Sort by create_at ASC.
- Only display username but add a tool tip that when hovered over will display the amount of time they have been online (now - created_at) format in plain english as seconds/minutes/hours, e.g. "Online for 15 minutes" or "Online for 10 seconds".


### API Schema
"openapi":"3.1.0","info":{"title":"FastAPI","version":"0.1.0"},"paths":{"/api/shapes":{"get":{"summary":"Get Shapes","description":"Returns the list of shapes.","operationId":"get_shapes_api_shapes_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}}},"post":{"summary":"Create Or Update Shapes","description":"Creates new shapes or updates existing ones from the provided list.","operationId":"create_or_update_shapes_api_shapes_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ShapesUpdateRequest"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation 
```

#### `user-heartbeat-1`

The bottom few lines where I revised the requirements for the POST route are where I performed the iteration. The first time iteration was to have the POST return the same list of active users as the GET (two kill two birds with one request). The second iteration was to ask the routes to generate a return type signature which would allow me to input the OpenAPI generated doc into the client-side prompt (which is above).

```mdc
Develop a route + in-memory data store to keep track of users currently using the application client-side.

Each user will have a username string they will post every heartbeat_poll_interval (~5 seconds, parameterize this in code) to the route as a heartbeat to say they 

In the in-memory datastore: 
- keep track of when the user was first added (created_at)
- update when that user last pinged the server on this route (modified_at)
- remove the user from the datastore if the you are currently accessing it the time since last modified_at > heartbeat_poll_interval + grace_period
    - grace_period should also be parameterized in code, and should start equal to heartbeat_poll_interval
- make this safe for use with multiple concurrent users within this async request framework.

- routes: /api/user_online
    - GET: return a list of users, sorted by create_at time
    - POST: data: userName (str)
        - should also return a list of users, sorted by create_at time (same as the GET)
        - this will allow the client to send and get info with one req-res instead of two
    - add return-types to the added routes so that the openapi can populate a response type
```