
L.CanvasLayer = (L.Layer ? L.Layer : L.Class).extend({ 
  // default options
  options: {},

  // Public Methods
  initialize(opts) {

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

    this._canvas = L.DomUtil.create('canvas', 'leaflet-layer')
    this._canvas.width = size.x
    this._canvas.height = size.y

    var animated = this._map.options.zoomAnimation && L.Browser.any3d
    L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'))

    this._map._panes.overlayPane.appendChild(this._canvas)

    this._map.on(this._getEvents(), this)
    
    this.fire('mounted', {map: this._map, canvas: this._canvas})  
    
    this.draw()
  },

  onRemove(map) {
    map.getPanes().overlayPane.removeChild(this._canvas)
    map.off(this.getEvents(), this)
    this.fire('unmount')
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

  // Private Methods
  _getEvents() {

    return {
      click:     dispatch('click'),
      moveend:   dispatch('moveend'),
      viewreset: dispatch('viewreset'),
      resize:    dispatch('resize'),
    }
    
    let dispatch = function(eventName) {
      let self = this

      return function(e) {
        e.prototype.getBufferedBounds = getBufferedBounds
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

      let leftcorner = this.target.containerPointToLatLng(L.point(bufferUpperLeft))
      let rightcorner = this.target.containerPointToLatLng(L.point(bufferLowerRight))

      return L.latLngBounds(leftcorner, rightcorner)   
    }
  },

  LatLonToMercator(latlon) {
    return {
      x: latlon.lng * 6378137 * Math.PI / 180,
      y: Math.log(Math.tan((90 + latlon.lat) * Math.PI / 360)) * 6378137
    }
  }
})
