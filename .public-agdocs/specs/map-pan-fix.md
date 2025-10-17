currently the map is able to pan and zoom along with orginal the canvas, however the zoom transformation is not matching the canvas: the observed behavior is the canvas and the map are both zooming with mouse wheel, but are not sync'd. This causes the shapes on the canvas to move across the map instead of staying locked.

### Assumptions:
- we don't need an infinite scroll canvas only to move several viewports left and right
- we likely don't need every zoom on the canvas to get a new set of tiles since the canvas zoom is more continuous while tiles are discrete zoomLevels.

### Previous implementation

commit 24877bda7bea6125b1b4ba036cb0872b142115a2
Author: sutt <wsutton17@gmail.com>
Date:   Fri Oct 17 12:40:36 2025 -0400

    feat: sync mapbox pan with canvas pan

diff --git a/my-react-app/src/DemoFigma.tsx b/my-react-app/src/DemoFigma.tsx
index 83bc2d3..2983fa7 100644
--- a/my-react-app/src/DemoFigma.tsx
+++ b/my-react-app/src/DemoFigma.tsx
@@ -726,9 +726,9 @@ function DemoFigma() {
       interactive: false,
     });
 
-    // MANUAL INTERVENTION: This is a proof-of-concept. The map is currently a static background
-    // and does not pan or zoom with the canvas content. A more advanced implementation
-    // would require synchronizing the map's viewport with the canvas's pan and zoom state.
+    // MANUAL INTERVENTION: This is a proof-of-concept. The map pans with the canvas,
+    // but does not zoom with it. A more advanced implementation would require
+    // synchronizing the map's viewport with the canvas's zoom state.
   }, []);
 
   const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
@@ -840,6 +840,10 @@ function DemoFigma() {
       const dx = e.clientX - lastMousePosition.current.x;
       const dy = e.clientY - lastMousePosition.current.y;
       lastMousePosition.current = { x: e.clientX, y: e.clientY };
+
+      if (mapRef.current) {
+        mapRef.current.panBy([-dx, -dy], { duration: 0 });
+      }
       
       setPan(prevPan => {
         const newPan = { x: prevPan.x + dx, y: prevPan.y + dy };
