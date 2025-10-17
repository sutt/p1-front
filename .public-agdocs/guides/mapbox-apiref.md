# Properties and options | Mapbox GL JS | Mapbox
Mapbox GL JS's global properties and options that you can access while initializing your map or accessing information about its status.

Was this section on accessToken helpful?

[AnimationOptions](#animationoptions)
-------------------------------------

[githubsrc/ui/camera.ts](https://github.com/mapbox/mapbox-gl-js/blob/339b8254061c11f52bc7121cf1399d496933e01f/src/ui/camera.ts#L100-L134)

Options common to map movement methods that involve animation, such as [Map#panBy](about:/mapbox-gl-js/api/map/#map#panby) and [Map#easeTo](about:/mapbox-gl-js/api/map/#map#easeto), controlling the duration and easing function of the animation. All properties are optional.

### [Type](#animationoptions-type)

`[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)`

### [Properties](#animationoptions-properties)



* Name: animateboolean
  * Description: If false, no animation will occur.
* Name: curvenumber
  * Description: The zooming "curve" that will occur along theflight path. A high value maximizes zooming for an exaggerated animation, while a lowvalue minimizes zooming for an effect closer to Map#easeTo. 1.42 is the averagevalue selected by participants in the user study discussed invan Wijk (2003). A value ofMath.pow(6, 0.25) would be equivalent to the root mean squared average velocity. Avalue of 1 would produce a circular motion. If minZoom is specified, this option will be ignored.
* Name: durationnumber
  * Description: The animation's duration, measured in milliseconds.
* Name: easingFunction
  * Description: A function taking a time in the range 0..1 and returning a number where 0 isthe initial state and 1 is the final state.
* Name: essentialboolean
  * Description: If true, then the animation is considered essential and will not be affected byprefers-reduced-motion.
* Name: maxDurationnumber
  * Description: The animation's maximum duration, measured in milliseconds.If duration exceeds maximum duration, it resets to 0.
* Name: minZoomnumber
  * Description: The zero-based zoom level at the peak of the flight path. Ifthis option is specified, curve will be ignored.
* Name: offsetPointLike
  * Description: The target center's offset relative to real map container center at the end of animation.
* Name: preloadOnlyboolean
  * Description: If true, it will trigger tiles loading across the animation path, but no animation will occur.
* Name: screenSpeednumber
  * Description: The average speed of the animation measured in screenfulsper second, assuming a linear timing curve. If speed is specified, this option is ignored.
* Name: speednumber
  * Description: The average speed of the animation defined in relation tocurve. A speed of 1.2 means that the map appears to move along the flight pathby 1.2 times curve screenfuls every second. A screenful is the map's visible span.It does not correspond to a fixed physical distance, but varies by zoom level.


*   [Example: Slowly fly to a location](https://docs.mapbox.com/mapbox-gl-js/example/flyto-options/)
*   [Example: Customize camera animations](https://docs.mapbox.com/mapbox-gl-js/example/camera-animation/)
*   [Example: Navigate the map with game-like controls](https://docs.mapbox.com/mapbox-gl-js/example/game-controls/)

Was this section on AnimationOptions helpful?

Was this section on baseApiUrl helpful?

[CameraOptions](#cameraoptions)
-------------------------------

[githubsrc/ui/camera.ts](https://github.com/mapbox/mapbox-gl-js/blob/339b8254061c11f52bc7121cf1399d496933e01f/src/ui/camera.ts#L45-L81)

Options common to [Map#jumpTo](about:/mapbox-gl-js/api/map/#map#jumpto), [Map#easeTo](about:/mapbox-gl-js/api/map/#map#easeto), and [Map#flyTo](about:/mapbox-gl-js/api/map/#map#flyto), controlling the desired location, zoom, bearing, and pitch of the camera. All properties are optional, and when a property is omitted, the current camera value for that property will remain unchanged.

### [Type](#cameraoptions-type)

`[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)`

### [Properties](#cameraoptions-properties)



* Name: aroundLngLatLike
  * Description: The location serving as the origin for a change in zoom, pitch and/or bearing.This location will remain at the same screen position following the transform.This is useful for drawing attention to a location that is not in the screen center.center is ignored if around is included.
* Name: bearingnumber
  * Description: The desired bearing in degrees. The bearing is the compass direction thatis "up". For example, bearing: 90 orients the map so that east is up.
* Name: centerLngLatLike
  * Description: The location to place at the screen center.
* Name: paddingPaddingOptions
  * Description: Dimensions in pixels applied on each side of the viewport for shifting the vanishing point.Note that when padding is used with jumpTo, easeTo, and flyTo, it also sets the global map padding as a side effect,affecting all subsequent camera movements until the padding is reset. To avoid this, add the retainPadding: false option.
* Name: pitchnumber
  * Description: The desired pitch in degrees. The pitch is the angle towards the horizonmeasured in degrees with a range between 0 and 85 degrees. For example, pitch: 0 provides the appearanceof looking straight down at the map, while pitch: 60 tilts the user's perspective towards the horizon.Increasing the pitch value is often used to display 3D objects.
* Name: retainPaddingboolean
  * Description: If false, the value provided with the padding option will not be retained as the global map padding. This is true by default.
* Name: zoomnumber
  * Description: The desired zoom level.


### [Example](#cameraoptions-example)

*   [Example: Set pitch and bearing](https://docs.mapbox.com/mapbox-gl-js/example/set-perspective/)
*   [Example: Jump to a series of locations](https://docs.mapbox.com/mapbox-gl-js/example/jump-to/)
*   [Example: Fly to a location](https://docs.mapbox.com/mapbox-gl-js/example/flyto/)
*   [Example: Display buildings in 3D](https://docs.mapbox.com/mapbox-gl-js/example/3d-buildings/)

Was this section on CameraOptions helpful?

[clearPrewarmedResources](#clearprewarmedresources)
---------------------------------------------------

[githubsrc/index.ts](https://github.com/mapbox/mapbox-gl-js/blob/339b8254061c11f52bc7121cf1399d496933e01f/src/index.ts#L139-L139)

Clears up resources that have previously been created by [`mapboxgl.prewarm()`](https://docs.mapbox.com/mapbox-gl-js/api/properties/#prewarm). Note that this is typically not necessary. You should only call this function if you expect the user of your app to not return to a Map view at any point in your application.

### [Example](#clearprewarmedresources-example)

Was this section on clearPrewarmedResources helpful?

[clearStorage](#clearstorage)
-----------------------------

[githubsrc/index.ts](https://github.com/mapbox/mapbox-gl-js/blob/339b8254061c11f52bc7121cf1399d496933e01f/src/index.ts#L226-L228)

Clears browser storage used by this library. Using this method flushes the Mapbox tile cache that is managed by this library. Tiles may still be cached by the browser in some cases.

This API is supported on browsers where the [`Cache` API](https://developer.mozilla.org/en-US/docs/Web/API/Cache) is supported and enabled. This includes all major browsers when pages are served over `https://`, except Internet Explorer and Edge Mobile.

When called in unsupported browsers or environments (private or incognito mode), the callback will be called with an error argument.

### [Parameters](#clearstorage-parameters)


|Name            |Description                                        |
|----------------|---------------------------------------------------|
|callbackFunction|Called with an error argument if there is an error.|


### [Example](#clearstorage-example)

Was this section on clearStorage helpful?

[CustomLayerInterface](#customlayerinterface)
---------------------------------------------

[githubsrc/style/style\_layer/custom\_style\_layer.ts](https://github.com/mapbox/mapbox-gl-js/blob/339b8254061c11f52bc7121cf1399d496933e01f/src/style/style_layer/custom_style_layer.ts#L177-L197)

Interface for custom style layers. This is a specification for implementers to model: it is not an exported method or class.

Custom layers allow a user to render directly into the map's GL context using the map's camera. These layers can be added between any regular layers using [Map#addLayer](about:/mapbox-gl-js/api/map/#map#addlayer).

Custom layers must have a unique `id` and must have the `type` of `"custom"`. They must implement `render` and may implement `prerender`, `onAdd` and `onRemove`. They can trigger rendering using [Map#triggerRepaint](about:/mapbox-gl-js/api/map/#map#triggerrepaint) and they should appropriately handle [Map.event:webglcontextlost](about:/mapbox-gl-js/api/map/#map.event:webglcontextlost) and [Map.event:webglcontextrestored](about:/mapbox-gl-js/api/map/#map.event:webglcontextrestored).

The `renderingMode` property controls whether the layer is treated as a `"2d"` or `"3d"` map layer. Use:

*   `"renderingMode": "3d"` to use the depth buffer and share it with other layers
*   `"renderingMode": "2d"` to add a layer with no depth. If you need to use the depth buffer for a `"2d"` layer you must use an offscreen framebuffer and [CustomLayerInterface#prerender](about:/mapbox-gl-js/api/properties/#customlayerinterface#prerender).

### [Properties](#customlayerinterface-properties)



* Name: idstring
  * Description: A unique layer id.
* Name: renderingModestring
  * Description: Either "2d" or "3d". Defaults to "2d".
* Name: typestring
  * Description: The layer's type. Must be "custom".
* Name: wrapTileIdboolean
  * Description: If renderWorldCopies is enabled renderToTile of the custom layer method will be called with different x value of the tile rendered on different copies of the world unless wrapTileId is set to true. Defaults to false.


### [Example](#customlayerinterface-example)

### [Static Members](#customlayerinterface-static-members)

### [Instance Members](#customlayerinterface-instance-members)

*   [Example: Add a custom style layer](https://docs.mapbox.com/mapbox-gl-js/example/custom-style-layer/)
*   [Example: Add a 3D model](https://docs.mapbox.com/mapbox-gl-js/example/add-3d-model/)

Was this section on CustomLayerInterface helpful?

[FreeCameraOptions](#freecameraoptions)
---------------------------------------

[githubsrc/ui/free\_camera.ts](https://github.com/mapbox/mapbox-gl-js/blob/339b8254061c11f52bc7121cf1399d496933e01f/src/ui/free_camera.ts#L97-L176)

Options for accessing physical properties of the underlying camera entity. Direct access to these properties allows more flexible and precise controlling of the camera. These options are also fully compatible and interchangeable with CameraOptions. All fields are optional. See [Map#setFreeCameraOptions](about:/mapbox-gl-js/api/map/#map#setfreecameraoptions) and [Map#getFreeCameraOptions](about:/mapbox-gl-js/api/map/#map#getfreecameraoptions).

### [Parameters](#freecameraoptions-parameters)



* Name: positionMercatorCoordinate
  * Description: Position of the camera in slightly modified web mercator coordinates.The size of 1 unit is the width of the projected world instead of the "mercator meter".Coordinate [0, 0, 0] is the north-west corner and [1, 1, 0] is the south-east corner.Z coordinate is conformal and must respect minimum and maximum zoom values.Zoom is automatically computed from the altitude (z).
* Name: orientationquat
  * Description: Orientation of the camera represented as a unit quaternion [x, y, z, w] in a left-handed coordinate space.Direction of the rotation is clockwise around the respective axis.The default pose of the camera is such that the forward vector is looking up the -Z axis.The up vector is aligned with north orientation of the map:forward: [0, 0, -1]up:      [0, -1, 0]right    [1, 0, 0]Orientation can be set freely but certain constraints still apply:Orientation must be representable with only pitch and bearing.Pitch has an upper limit.


### [Example](#freecameraoptions-example)

### [Instance Members](#freecameraoptions-instance-members)

*   [Example: Animate the camera around a point in 3D terrain](https://docs.mapbox.com/mapbox-gl-js/example/free-camera-point/)
*   [Example: Animate the camera along a path](https://docs.mapbox.com/mapbox-gl-js/example/free-camera-path/)

Was this section on FreeCameraOptions helpful?

[getRTLTextPluginStatus](#getrtltextpluginstatus)
-------------------------------------------------

[githubsrc/index.ts](https://github.com/mapbox/mapbox-gl-js/blob/339b8254061c11f52bc7121cf1399d496933e01f/src/index.ts#L384-L384)

Gets the map's [RTL text plugin](https://www.mapbox.com/mapbox-gl-js/plugins/#mapbox-gl-rtl-text) status. The status can be `unavailable` (not requested or removed), `loading`, `loaded`, or `error`. If the status is `loaded` and the plugin is requested again, an error will be thrown.

### [Example](#getrtltextpluginstatus-example)

Was this section on getRTLTextPluginStatus helpful?

[maxParallelImageRequests](#maxparallelimagerequests)
-----------------------------------------------------

[githubsrc/index.ts](https://github.com/mapbox/mapbox-gl-js/blob/339b8254061c11f52bc7121cf1399d496933e01f/src/index.ts#L201-L203)

Gets and sets the maximum number of images (raster tiles, sprites, icons) to load in parallel. 16 by default. There is no maximum value, but the number of images affects performance in raster-heavy maps.

### [Type](#maxparallelimagerequests-type)

`[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)`

### [Returns](#maxparallelimagerequests-returns)

`[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)`: Number of parallel requests currently configured.

### [Example](#maxparallelimagerequests-example)

Was this section on maxParallelImageRequests helpful?

Was this section on PaddingOptions helpful?

[prewarm](#prewarm)
-------------------

[githubsrc/index.ts](https://github.com/mapbox/mapbox-gl-js/blob/339b8254061c11f52bc7121cf1399d496933e01f/src/index.ts#L128-L128)

Initializes resources like WebWorkers that can be shared across maps to lower load times in some situations. [`mapboxgl.workerUrl`](https://docs.mapbox.com/mapbox-gl-js/api/properties/#workerurl) and [`mapboxgl.workerCount`](https://docs.mapbox.com/mapbox-gl-js/api/properties/#workercount), if being used, must be set before `prewarm()` is called to have an effect.

By default, the lifecycle of these resources is managed automatically, and they are lazily initialized when a `Map` is first created. Invoking `prewarm()` creates these resources ahead of time and ensures they are not cleared when the last `Map` is removed from the page. This allows them to be re-used by new `Map` instances that are created later. They can be manually cleared by calling [`mapboxgl.clearPrewarmedResources()`](https://docs.mapbox.com/mapbox-gl-js/api/properties/#clearprewarmedresources). This is only necessary if your web page remains active but stops using maps altogether. `prewarm()` is idempotent and has guards against being executed multiple times, and any resources allocated by `prewarm()` are created synchronously.

This is primarily useful when using Mapbox GL JS maps in a single page app, in which a user navigates between various views, resulting in constant creation and destruction of `Map` instances.

### [Example](#prewarm-example)

Was this section on prewarm helpful?

[RequestParameters](#requestparameters)
---------------------------------------

[githubsrc/util/ajax.ts](https://github.com/mapbox/mapbox-gl-js/blob/339b8254061c11f52bc7121cf1399d496933e01f/src/util/ajax.ts#L36-L63)

A `RequestParameters` object to be returned from Map.options.transformRequest callbacks.

### [Type](#requestparameters-type)

`[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)`

### [Properties](#requestparameters-properties)



* Name: bodystring
  * Description: Request body.
* Name: collectResourceTimingboolean
  * Description: If true, Resource Timing API information will be collected for these transformed requests and returned in a resourceTiming property of relevant data events.
* Name: credentialsstring
  * Description: 'same-origin'|'include' Use 'include' to send cookies with cross-origin requests.
* Name: Object
  * Description: The headers to be sent with the request.
* Name: methodstring
  * Description: Request method 'GET' | 'POST' | 'PUT'.
* Name: referrerPolicystring
  * Description: A string representing the request's referrerPolicy. For more information and possible values, see the Referrer-Policy HTTP header page.
* Name: typestring
  * Description: Response body type to be returned 'string' | 'json' | 'arrayBuffer'.
* Name: urlstring
  * Description: The URL to be requested.


### [Example](#requestparameters-example)

Was this section on RequestParameters helpful?

[setRTLTextPlugin](#setrtltextplugin)
-------------------------------------

[githubsrc/index.ts](https://github.com/mapbox/mapbox-gl-js/blob/339b8254061c11f52bc7121cf1399d496933e01f/src/index.ts#L384-L384)

Sets the map's [RTL text plugin](https://www.mapbox.com/mapbox-gl-js/plugins/#mapbox-gl-rtl-text). Necessary for supporting the Arabic and Hebrew languages, which are written right-to-left. Mapbox Studio loads this plugin by default.

### [Parameters](#setrtltextplugin-parameters)



* Name: pluginURLstring
  * Description: URL pointing to the Mapbox RTL text plugin source.
* Name: callbackFunction
  * Description: Called with an error argument if there is an error, or no arguments if the plugin loads successfully.
* Name: lazyboolean
  * Description: If set to true, MapboxGL will defer loading the plugin until right-to-left text is encountered, andright-to-left text will be rendered only after the plugin finishes loading.


### [Example](#setrtltextplugin-example)

*   [Example: Add support for right-to-left scripts](https://www.mapbox.com/mapbox-gl-js/example/mapbox-gl-rtl-text/)

Was this section on setRTLTextPlugin helpful?

Was this section on StyleImageInterface helpful?

Was this section on supported helpful?

[version](#version)
-------------------

[githubsrc/index.ts](https://github.com/mapbox/mapbox-gl-js/blob/339b8254061c11f52bc7121cf1399d496933e01f/src/index.ts#L384-L384)

Gets the version of Mapbox GL JS in use as specified in `package.json`, `CHANGELOG.md`, and the GitHub release.

### [Type](#version-type)

`[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)`

### [Example](#version-example)

Was this section on version helpful?

[workerClass](#workerclass)
---------------------------

[githubsrc/index.ts](https://github.com/mapbox/mapbox-gl-js/blob/339b8254061c11f52bc7121cf1399d496933e01f/src/index.ts#L268-L270)

Provides an interface for external module bundlers such as Webpack or Rollup to package mapbox-gl's WebWorker into a separate class and integrate it with the library.

Takes precedence over `mapboxgl.workerUrl`.

### [Type](#workerclass-type)

`[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)`

### [Returns](#workerclass-returns)

`([Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | null)`: A class that implements the `Worker` interface.

### [Example](#workerclass-example)

Was this section on workerClass helpful?

[workerCount](#workercount)
---------------------------

[githubsrc/index.ts](https://github.com/mapbox/mapbox-gl-js/blob/339b8254061c11f52bc7121cf1399d496933e01f/src/index.ts#L184-L186)

Gets and sets the number of web workers instantiated on a page with Mapbox GL JS maps. By default, it is set to 2. Make sure to set this property before creating any map instances for it to have effect.

### [Type](#workercount-type)

`[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)`

### [Returns](#workercount-returns)

`[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)`: Number of workers currently configured.

### [Example](#workercount-example)

Was this section on workerCount helpful?

[workerUrl](#workerurl)
-----------------------

[githubsrc/index.ts](https://github.com/mapbox/mapbox-gl-js/blob/339b8254061c11f52bc7121cf1399d496933e01f/src/index.ts#L246-L248)

Provides an interface for loading mapbox-gl's WebWorker bundle from a self-hosted URL. This needs to be set only once, and before any call to `new mapboxgl.Map(..)` takes place. This is useful if your site needs to operate in a strict CSP (Content Security Policy) environment wherein you are not allowed to load JavaScript code from a [`Blob` URL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL), which is default behavior.

See our documentation on [CSP Directives](https://docs.mapbox.com/mapbox-gl-js/guides/browsers/#csp-directives) for more details.

### [Type](#workerurl-type)

`[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)`

### [Returns](#workerurl-returns)

`[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)`: A URL hosting a JavaScript bundle for mapbox-gl's WebWorker.

### [Example](#workerurl-example)

Was this section on workerUrl helpful?