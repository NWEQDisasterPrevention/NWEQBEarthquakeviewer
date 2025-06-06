/**
 * Map service for displaying earthquakes on a map
 */
class EarthquakeMap {
    constructor(mapElementId) {
        this.mapElementId = mapElementId;
        this.map = null;
        this.markers = {};
        this.tileLayer = null;
        this.mapStyle = this._getMapStyle();
    }
    
    /**
     * Initialize the map
     */
    initialize() {
        // Create the map
        this.map = L.map(this.mapElementId).setView(CONFIG.MAP.DEFAULT_CENTER, CONFIG.MAP.DEFAULT_ZOOM);
        
        // Add the tile layer
        this._updateTileLayer();
        
        // Add scale control
        L.control.scale().addTo(this.map);
    }
    
    /**
     * Update the map with earthquake data
     * @param {Array} earthquakes - The earthquake data to display
     */
    updateMap(earthquakes) {
        // Clear existing markers
        this._clearMarkers();
        
        // Add new markers
        for (const earthquake of earthquakes) {
            this.addEarthquake(earthquake);
        }
    }
    
    /**
     * Add a single earthquake to the map
     * @param {Object} earthquake - The earthquake data
     */
    addEarthquake(earthquake) {
        // Skip if the earthquake doesn't have coordinates
        if (!earthquake.earthquake || !earthquake.earthquake.hypocenter || 
            !earthquake.earthquake.hypocenter.latitude || !earthquake.earthquake.hypocenter.longitude) {
            return;
        }
        
        const id = earthquake.id;
        const latitude = earthquake.earthquake.hypocenter.latitude;
        const longitude = earthquake.earthquake.hypocenter.longitude;
        const magnitude = earthquake.earthquake.hypocenter.magnitude || 0;
        const depth = earthquake.earthquake.hypocenter.depth || 0;
        const location = earthquake.earthquake.hypocenter.name;
        const time = earthquake.earthquake.time;
        
        // Get intensity
        let intensity = 'Unknown';
        if (earthquake.earthquake.maxScale) {
            intensity = CONFIG.INTENSITY_SCALE[earthquake.earthquake.maxScale] || 'Unknown';
        }
        
        // Get marker size based on magnitude
        const magnitudeFloor = Math.floor(magnitude);
        const [size, borderWidth] = CONFIG.MAGNITUDE_TO_SIZE[magnitudeFloor] || CONFIG.MAGNITUDE_TO_SIZE[0];
        
        // Create custom marker
        const markerHtml = `
            <div class="earthquake-marker ${CONFIG.INTENSITY_CLASS[intensity] || ''}" 
                 style="width: ${size}px; height: ${size}px; border-width: ${borderWidth}px;">
                ${magnitude.toFixed(1)}
            </div>
        `;
        
        const icon = L.divIcon({
            html: markerHtml,
            className: '',
            iconSize: [size, size]
        });
        
        // Create marker
        const marker = L.marker([latitude, longitude], { icon: icon });
        
        // Create popup content
        const popupContent = `
            <div class="earthquake-popup">
                <h5>${location}</h5>
                <p><strong>Time:</strong> ${time}</p>
                <p><strong>Magnitude:</strong> ${magnitude.toFixed(1)}</p>
                <p><strong>Depth:</strong> ${depth} km</p>
                <p><strong>Intensity:</strong> ${intensity}</p>
                <button class="btn btn-sm btn-primary view-details-btn" data-id="${id}">View Details</button>
            </div>
        `;
        
        // Add popup to marker
        marker.bindPopup(popupContent);
        
        // Add marker to map
        marker.addTo(this.map);
        
        // Store marker
        this.markers[id] = marker;
        
        // Add click event to the "View Details" button
        marker.on('popupopen', () => {
            const viewDetailsBtn = document.querySelector(`.view-details-btn[data-id="${id}"]`);
            if (viewDetailsBtn) {
                viewDetailsBtn.addEventListener('click', () => {
                    // Trigger a custom event to view earthquake details
                    const event = new CustomEvent('viewEarthquakeDetails', { detail: { id } });
                    document.dispatchEvent(event);
                });
            }
        });
    }
    
    /**
     * Focus the map on a specific earthquake
     * @param {string} id - The ID of the earthquake to focus on
     */
    focusEarthquake(id) {
        const marker = this.markers[id];
        if (marker) {
            this.map.setView(marker.getLatLng(), 8);
            marker.openPopup();
        }
    }
    
    /**
     * Update the map style
     * @param {string} style - The map style to use ('streets', 'satellite', 'hybrid')
     */
    updateMapStyle(style) {
        this.mapStyle = style;
        localStorage.setItem(CONFIG.STORAGE_KEYS.MAP_STYLE, style);
        this._updateTileLayer();
    }
    
    /**
     * Clear all markers from the map
     * @private
     */
    _clearMarkers() {
        for (const id in this.markers) {
            this.markers[id].remove();
        }
        this.markers = {};
    }
    
    /**
     * Update the tile layer based on the current map style
     * @private
     */
    _updateTileLayer() {
        // Remove existing tile layer
        if (this.tileLayer) {
            this.map.removeLayer(this.tileLayer);
        }
        
        // Add new tile layer based on style
        let tileUrl;
        switch (this.mapStyle) {
            case 'satellite':
                tileUrl = CONFIG.MAP.TILE_LAYER.SATELLITE;
                break;
            case 'hybrid':
                tileUrl = CONFIG.MAP.TILE_LAYER.HYBRID;
                break;
            case 'streets':
            default:
                tileUrl = CONFIG.MAP.TILE_LAYER.STREETS;
                break;
        }
        
        this.tileLayer = L.tileLayer(tileUrl, {
            attribution: CONFIG.MAP.ATTRIBUTION,
            maxZoom: 19
        }).addTo(this.map);
    }
    
    /**
     * Get the map style from local storage or use the default
     * @returns {string} - The map style
     * @private
     */
    _getMapStyle() {
        const style = localStorage.getItem(CONFIG.STORAGE_KEYS.MAP_STYLE);
        return style || CONFIG.DEFAULTS.MAP_STYLE;
    }
}