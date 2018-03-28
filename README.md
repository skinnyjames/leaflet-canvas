# leaflet-canvas

a canvas layer for leaflet maps
derived from [Sumbera/gLayers.Leaflet](http://github.com/Sumbera/gLayers.Leaflet)


## test it out

```
git clone git@github.com:skinnyjames/leaflet-canvas.git
npm install 
npm run build
npm run dev

```

### api

`draw` -> draws the canvas layer

### events

* `drawing` -> invoked before each draw cycle
   exposes the canvas element, map, bounds, size, zoom, center and corner
   register this event to draw on the canvas

*  `click` -> invoked when the canvas is clicked 
   exposes getBufferedBounds in the event object

*  `mousemove` -> invoked on hover
   exposes getBufferedBounds in the event object

*  `move` -> invoked when the canvas moves

*  `moveend` -> invoked after a canvas move

