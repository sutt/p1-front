Currently there's a bug in coord alignment between canvas and map coords for clients with different sized windows.

The problem appears to be that the map is positioned by center and canvas is positioned by x,y for topleft.

We want to create a way to fix or workaround this issue so that the shapes which are positioned by canvas coords remain in the same position over the map when it is displayed.

Note: there's some previous work on this issue for changing the pan and the zoom for of the canvas before initializing the map, the code diffs are listed below.

### PRevious fixes

diff --git a/my-react-app/src/DemoFigma.tsx b/my-react-app/src/DemoFigma.tsx
index 8f9ef0b..4573ac5 100644
--- a/my-react-app/src/DemoFigma.tsx
+++ b/my-react-app/src/DemoFigma.tsx
@@ -796,6 +796,27 @@ function DemoFigma() {
 
     if (mapRef.current || !mapContainerRef.current) return;
 
+    if (zoom !== 1.0 && canvasRef.current) {
+      setHintMessage('Auto-adjusting zoom to sync with map...');
+      setTimeout(() => setHintMessage(''), 3000);
+
+      const rect = canvasRef.current.getBoundingClientRect();
+      const centerX = rect.width / 2;
+      const centerY = rect.height / 2;
+
+      const pointX = (centerX - pan.x) / zoom;
+      const pointY = (centerY - pan.y) / zoom;
+
+      const newZoom = 1.0;
+
+      const newPanX = centerX - pointX * newZoom;
+      const newPanY = centerY - pointY * newZoom;
+
+      setZoom(newZoom);
+      setPan({ x: newPanX, y: newPanY });
+      return;
+    }
+
     // MANUAL INTERVENTION: You need to add your Mapbox access token to your .env file.
     // Create a .env file in the my-react-app directory and add:
     // VITE_MAPBOX_TOKEN=your_token_here
@@ -822,10 +843,15 @@ function DemoFigma() {
     baseMapZoomRef.current = initialZoom;
     setCurrentMapZoom(initialZoom);
 
+    // FIX: Synchronize map with current canvas pan state to prevent coordinate drift
+    // If the canvas was panned before the map was initialized, we need to sync the map position
+    // The map needs to be panned in the opposite direction of the canvas pan
+    mapRef.current.panBy([-pan.x, -pan.y], { duration: 0 });
+
     // MANUAL INTERVENTION: This is a proof-of-concept. The map pans with the canvas,
     // but does not zoom with it. A more advanced implementation would require
     // synchronizing the map's viewport with the canvas's zoom state.
-  }, [showMap]);
+  }, [showMap, zoom, pan]);
 
   const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
     dragHappened.current = false;
