
- request: when a user moves a shape, resizes, edits-text a shape they have selected, dont release selection property for that user, the shape stays should stay selected.
- this requested logic has been partially implemented in the diff seen below.
- however there is a case where this request is not being applied: drag-and-drop move. keep selection on the shape after a drag and drop is complete. 


commit bd71dd1fb5782248077b042b8df518c8dcd6f34d
Author: sutt <wsutton17@gmail.com>
Date:   Wed Oct 15 22:29:41 2025 -0400

    fix: preserve selection on updates and prevent concurrent text edits

diff --git a/my-react-app/src/DemoFigma.tsx b/my-react-app/src/DemoFigma.tsx
index 05bbaa9..ed97c19 100644
--- a/my-react-app/src/DemoFigma.tsx
+++ b/my-react-app/src/DemoFigma.tsx
@@ -296,12 +296,15 @@ function DemoFigma() {
   }, [currentUser]);
 
   const finishEditing = useCallback(async () => {
-    // By awaiting the server update before hiding the editor, we prevent a race
-    // condition where a polling fetch could overwrite the local optimistic
-    // text update with stale data from the server.
-    await updateShapesOnServer(shapes);
+    const shapeToUpdate = shapes.find(s => s.id === editingShapeId);
+    if (shapeToUpdate) {
+      // By awaiting the server update before hiding the editor, we prevent a race
+      // condition where a polling fetch could overwrite the local optimistic
+      // text update with stale data from the server.
+      await updateShapesOnServer([shapeToUpdate]);
+    }
     setEditingShapeId(null);
-  }, [shapes, updateShapesOnServer]);
+  }, [shapes, updateShapesOnServer, editingShapeId]);
 
   const handleSignup = async () => {
     const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
@@ -696,13 +699,13 @@ function DemoFigma() {
 
     if (isMoveMode && selectedShapeForCurrentUser) {
       setShapes(prevShapes => {
-        const newShapes = prevShapes.map(shape =>
-          shape.id === selectedShapeForCurrentUser.id
-            ? { ...shape, x: Math.round(canvasX), y: Math.round(canvasY) }
-            : shape
-        );
-        updateShapesOnServer(newShapes);
-        return newShapes;
+        const shapeToMove = prevShapes.find(s => s.id === selectedShapeForCurrentUser.id);
+        if (!shapeToMove) return prevShapes;
+
+        const movedShape = { ...shapeToMove, x: Math.round(canvasX), y: Math.round(canvasY) };
+        updateShapesOnServer([movedShape]);
+
+        return prevShapes.map(s => s.id === movedShape.id ? movedShape : s);
       });
       setIsMoveMode(false);
       setHintMessage('Shape moved. Move-shape mode is deactivated.');
@@ -1130,7 +1133,7 @@ function DemoFigma() {
                         justifyContent: 'center',
                         cursor: isSelectedByMe ? 'grab' : (isSelectedByOther && activeTool === 'select' ? 'not-allowed' : undefined),
                       }}
-                      onDoubleClick={() => setEditingShapeId(shape.id)}
+                      onDoubleClick={() => !isSelectedByOther && setEditingShapeId(shape.id)}
                     >
                       {shape.text}
                     </div>

