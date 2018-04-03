
L.CanvasLayer = (L.Layer ? L.Layer : L.Class).extend({ 
  // default options
  options: {},

  // Public Methods
  initialize(options) {

    this._map    = null
    this._canvas = null
    this._frame  = null

    L.setOptions(this, options)
  },   

  addTo(map) {
    map.addLayer(this);
    return this;
  },

  onAdd(map) {
    this._map = map
    let size = this._map.getSize()
    let self = this

    this._canvas = L.DomUtil.create('canvas', 'leaflet-layer')
    this._canvas.width = size.x
    this._canvas.height = size.y

    var animated = this._map.options.zoomAnimation && L.Browser.any3d
    L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'))

    this._map._panes.overlayPane.appendChild(this._canvas)
    
    this.fire('mounted', {map: this._map, canvas: this._canvas})  
    this.draw()
  },

  onRemove(map) {
    map.getPanes().overlayPane.removeChild(this._canvas)
    map.off(this.getEvents(), this)
    this.fire('unmounted')
    this._canvas = null;
  },


  draw() {
    if (!this._frame) {
      this._frame = L.Util.requestAnimFrame(this.drawLayer, this)
    }
    return this;
  },

  drawLayer() {
    let size   = this._map.getSize();
    let bounds = this._map.getBounds();
    let zoom   = this._map.getZoom();

    let center = this.LatLonToMercator(this._map.getCenter());
    let corner = this.LatLonToMercator(this._map.containerPointToLatLng(this._map.getSize()))

    let data = {
      layer:  this,
      canvas: this._canvas,
      bounds: bounds,
      size:   size,
      zoom:   zoom,
      center: center,
      corner: corner
    }

    this.fire('drawing', data)

    this._frame = null;
  },

  getEvents() {

    let self = this
    var lastClick = null

    let events = {
      click:     dispatch('click'),
      move:      dispatch('move'),
      moveend:   dispatch('moveend'),
      viewreset: dispatch('viewreset'),
      resize:    dispatch('resize'),
      zoom:      dispatch('zoom'),
      mousemove: dispatch('mousemove'),
    }

    if (this._map.options.zoomAnimation && L.Browser.any3d) {
        events.zoomanim =  this._animateZoom
    }

    return events
    
    function dispatch(eventName) {

      return function(e) {
        if (eventName == 'moveend' || eventName == 'move') {
          if (self._canvas) {
            var topLeft = self._map.containerPointToLayerPoint([0, 0])
            L.DomUtil.setPosition(self._canvas, topLeft)
          }
        }

        if (eventName == 'click' || eventName == 'mousemove') {
          e.getBufferedBounds = getBufferedBounds
        } 

        e.canvas = self._canvas  
        self.fire(eventName, e)

      }
    }

    function getBufferedBounds(pixels) {
      let bufferUpperLeft = {
        x: this.containerPoint.x - pixels,
        y: this.containerPoint.y - pixels
      }

      let bufferLowerRight = {
        x: this.containerPoint.x + pixels,
        y: this.containerPoint.y + pixels
      }

      let leftcorner =  self._map.containerPointToLatLng(L.point(bufferUpperLeft))
      let rightcorner = self._map.containerPointToLatLng(L.point(bufferLowerRight))

      return L.latLngBounds(leftcorner, rightcorner)   
    }
  },

  LatLonToMercator(latlon) {
    return {
      x: latlon.lng * 6378137 * Math.PI / 180,
      y: Math.log(Math.tan((90 + latlon.lat) * Math.PI / 360)) * 6378137
    }
  },

  _setTransform: function (el, offset, scale) {

    var pos = offset || new L.Point(0, 0);
    var translate

    if (L.Browser.ie3d) {
      translate = 'translate(' + pos.x + 'px,' + pos.y + 'px)'
    } else {
      translate = 'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)' + (scale ? ' scale(' + scale + ')' : '');
    }
    
    el.style[L.DomUtil.TRANSFORM] = translate
  },

  _animateZoom: function (e) {

      var scale = this._map.getZoomScale(e.zoom);
      var offset
      // -- different calc of animation zoom  in leaflet 1.0.3 thanks @peterkarabinovic, @jduggan1 
      if (L.Layer) {
        offset = this._map._latLngBoundsToNewLayerBounds(this._map.getBounds(), e.zoom, e.center).min 
      } else {
        offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());
      }
      L.DomUtil.setTransform(this._canvas, offset, scale);
  },
})
