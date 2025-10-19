Currently there's a bug in coord alignment between canvas and map coords for clients with different sized windows.

The problem appears to be that the map is positioned by center and canvas is positioned by x,y for topleft.

We want to create a way to fix or workaround this issue so that the shapes which are positioned by canvas coords remain in the same position over the map when it is displayed.

Working: Currently the solution listed below works once the map is initiated; the window is able to be resized and the shapes stay in place ontop of the map.

Still not working: If the window size is changed before the map is initiated then the shapes will be shifted from where they should be. Allow this method that is working for resize to work even before the map is initiated such that when the map is initiated the positioning of the map to the shapes and canvas-coords will remain stable.




### Previous change

commit b87159a5a8b8e674df8569370895aee25974347e
Author: sutt <wsutton17@gmail.com>
Date:   Sat Oct 18 17:43:48 2025 -0400

    fix: stabilize map/canvas alignment via top-left anchor and resize

diff --git a/my-react-app/src/DemoFigma.tsx b/my-react-app/src/DemoFigma.tsx
index 4573ac5..5223e2e 100644
--- a/my-react-app/src/DemoFigma.tsx
+++ b/my-react-app/src/DemoFigma.tsx
@@ -108,6 +108,16 @@ function DemoFigma() {
   const canvasRef = useRef<HTMLDivElement>(null);
   const onlineUsersRef = useRef<HTMLDivElement>(null);
   const mapWidgetRef = useRef<HTMLDivElement>(null);
+  const topLeftGeoRef = useRef<mapboxgl.LngLat | null>(null);
+
+  const applyTopLeftAnchor = useCallback(() => {
+    if (!mapRef.current || !topLeftGeoRef.current) return;
+    const container = mapRef.current.getContainer();
+    const tlPx = mapRef.current.project(topLeftGeoRef.current);
+    const centerPx = [tlPx.x + container.clientWidth / 2, tlPx.y + container.clientHeight / 2] as [number, number];
+    const centerLngLat = mapRef.current.unproject(centerPx);
+    mapRef.current.jumpTo({ center: centerLngLat, zoom: mapRef.current.getZoom() });
+  }, []);
 
   // Touch support state (Tier 1)
   const [isTouching, setIsTouching] = useState(false);
@@ -767,6 +777,8 @@ function DemoFigma() {
             setCurrentMapZoom(targetMapZoom);
             const around = mapRef.current.unproject([mouseX, mouseY] as [number, number]);
             mapRef.current.easeTo({ zoom: targetMapZoom, around, duration: 0 });
+            // Maintain a stable top-left geographic anchor across window sizes
+            topLeftGeoRef.current = mapRef.current.unproject([0, 0]);
         }
 
         if (DEBUG) {
@@ -847,12 +859,29 @@ function DemoFigma() {
     // If the canvas was panned before the map was initialized, we need to sync the map position
     // The map needs to be panned in the opposite direction of the canvas pan
     mapRef.current.panBy([-pan.x, -pan.y], { duration: 0 });
+    // Capture the current top-left as our geographic anchor to keep alignment stable across window sizes
+    topLeftGeoRef.current = mapRef.current.unproject([0, 0]);
 
     // MANUAL INTERVENTION: This is a proof-of-concept. The map pans with the canvas,
     // but does not zoom with it. A more advanced implementation would require
     // synchronizing the map's viewport with the canvas's zoom state.
   }, [showMap, zoom, pan]);
 
+  useEffect(() => {
+    const handleResize = () => {
+      if (mapRef.current) {
+        mapRef.current.resize();
+        if (topLeftGeoRef.current) {
+          applyTopLeftAnchor();
+        }
+      }
+    };
+    window.addEventListener('resize', handleResize);
+    return () => {
+      window.removeEventListener('resize', handleResize);
+    };
+  }, [applyTopLeftAnchor]);
+
   const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
     dragHappened.current = false;
     if (activeTool) return;
@@ -980,6 +1009,8 @@ function DemoFigma() {
 
       if (mapRef.current) {
         mapRef.current.panBy([-dx, -dy], { duration: 0 });
+        // Update our top-left anchor after panning
+        topLeftGeoRef.current = mapRef.current.unproject([0, 0]);
       }
       
       setPan(prevPan => {
@@ -1048,6 +1079,8 @@ function DemoFigma() {
     // Sync with mapbox
     if (mapRef.current) {
       mapRef.current.panBy([-dx, -dy], { duration: 0 });
+      // Update our top-left anchor after panning
+      topLeftGeoRef.current = mapRef.current.unproject([0, 0]);
     }
 
     // Update canvas pan
