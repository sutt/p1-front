We're exeperiencing a bug we're the canvas-coord's diverge from map-coords.

This appears to happen if the canvas is zoomed in/out from its initial 1.0 setting before the map is initialized. 

Note: contrary to the comments in DemoFigma, the map does zoom with the canvas but note that the zoom scales are different.

Implement a workaround for this problem: when initializing the map and the canvas zoom level is not 1.0 smoothly bring the zoom level back to 1.0 before initializing the map.

Add a message to the hint section explaining that the zoom is being adjusted automatically to initialize the map.


### PRevious fix
Previously this would occer when 
```
+    // FIX: Synchronize map with current canvas pan state to prevent coordinate drift
+    // If the canvas was panned before the map was initialized, we need to sync the map position
+    // The map needs to be panned in the opposite direction of the canvas pan
+    mapRef.current.panBy([-pan.x, -pan.y], { duration: 0 });
+
```