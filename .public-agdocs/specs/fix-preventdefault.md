Fix the following errors showing up in the logging:

DemoFigma.tsx:15 Unable to preventDefault inside passive event listener invocation.
preventDefault @ react-dom_client.js?v=80e31138:2702
handleWheel @ DemoFigma.tsx:15
executeDispatch @ react-dom_client.js?v=80e31138:13620
runWithFiberInDEV @ react-dom_client.js?v=80e31138:995
processDispatchQueue @ react-dom_client.js?v=80e31138:13656
(anonymous) @ react-dom_client.js?v=80e31138:14069
batchedUpdates$1 @ react-dom_client.js?v=80e31138:2624
dispatchEventForPluginEventSystem @ react-dom_client.js?v=80e31138:13761
dispatchEvent @ react-dom_client.js?v=80e31138:16782
dispatchContinuousEvent @ react-dom_client.js?v=80e31138:16773Understand this error
DemoFigma.tsx:37 Zoom state: {zoom: 0.4259147098971061, pan: {…}}