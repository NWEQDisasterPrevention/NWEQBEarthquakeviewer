/**
 * API service for fetching earthquake data
 */
class EarthquakeAPI {
    constructor() {
        this.baseUrl = CONFIG.API.BASE_URL;
        this.websocketUrl = CONFIG.API.WEBSOCKET_URL;
        this.websocket = null;
        this.listeners = [];
        this.connectionListeners = [];
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000; // Start with 2 seconds
    }
    
    /**
     * Connect to the WebSocket for real-time updates
     */
    connectWebSocket() {
        if (this.websocket && (this.websocket.readyState === WebSocket.OPEN || this.websocket.readyState === WebSocket.CONNECTING)) {
            return;
        }
        
        this._notifyConnectionListeners('connecting');
        
        this.websocket = new WebSocket(this.websocketUrl);
        
        this.websocket.onopen = () => {
            console.log('WebSocket connection established');
            this.reconnectAttempts = 0;
            this.reconnectDelay = 2000;
            this._notifyConnectionListeners('connected');
        };
        
        this.websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.code === 551) { // Earthquake information
                    this._notifyListeners(data);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        this.websocket.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
            this._notifyConnectionListeners('disconnected');
            
            // Attempt to reconnect if auto-refresh is enabled
            if (this._isAutoRefreshEnabled() && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                this.reconnectDelay *= 1.5; // Exponential backoff
                
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`);
                
                setTimeout(() => {
                    this.connectWebSocket();
                }, this.reconnectDelay);
            }
        };
        
        this.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }
    
    /**
     * Disconnect from the WebSocket
     */
    disconnectWebSocket() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
    }
    
    /**
     * Add a listener for earthquake updates
     * @param {Function} listener - The listener function to call when an earthquake is received
     */
    addEarthquakeListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * Remove an earthquake listener
     * @param {Function} listener - The listener to remove
     */
    removeEarthquakeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }
    
    /**
     * Add a connection status listener
     * @param {Function} listener - The listener function to call when connection status changes
     */
    addConnectionListener(listener) {
        this.connectionListeners.push(listener);
    }
    
    /**
     * Remove a connection status listener
     * @param {Function} listener - The listener to remove
     */
    removeConnectionListener(listener) {
        const index = this.connectionListeners.indexOf(listener);
        if (index !== -1) {
            this.connectionListeners.splice(index, 1);
        }
    }
    
    /**
     * Get recent earthquakes
     * @param {number} limit - The maximum number of earthquakes to return
     * @returns {Promise<Array>} - A promise that resolves to an array of earthquakes
     */
    async getRecentEarthquakes(limit = 20) {
        try {
            const response = await fetch(`${this.baseUrl}${CONFIG.API.HISTORY_ENDPOINT}?codes=551&limit=${limit}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.filter(item => item.code === 551);
        } catch (error) {
            console.error('Error fetching recent earthquakes:', error);
            throw error;
        }
    }
    
    /**
     * Get filtered earthquakes based on criteria
     * @param {Object} filters - The filters to apply
     * @param {number} filters.minMagnitude - The minimum magnitude
     * @param {string} filters.prefecture - The prefecture to filter by
     * @param {string} filters.startDate - The start date (YYYY-MM-DD)
     * @param {string} filters.endDate - The end date (YYYY-MM-DD)
     * @param {number} filters.limit - The maximum number of earthquakes to return
     * @returns {Promise<Array>} - A promise that resolves to an array of earthquakes
     */
    async getFilteredEarthquakes(filters = {}) {
        try {
            let url = `${this.baseUrl}${CONFIG.API.JMA_QUAKE_ENDPOINT}?`;
            
            // Add filters to the URL
            if (filters.minMagnitude && filters.minMagnitude > 0) {
                url += `minMagnitude=${filters.minMagnitude}&`;
            }
            
            if (filters.prefecture && filters.prefecture !== '') {
                url += `prefecture=${encodeURIComponent(filters.prefecture)}&`;
            }
            
            if (filters.startDate) {
                url += `sinceDate=${filters.startDate}&`;
            }
            
            if (filters.endDate) {
                url += `untilDate=${filters.endDate}&`;
            }
            
            // Add limit
            url += `limit=${filters.limit || 100}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching filtered earthquakes:', error);
            throw error;
        }
    }
    
    /**
     * Notify all earthquake listeners of a new earthquake
     * @param {Object} earthquake - The earthquake data
     * @private
     */
    _notifyListeners(earthquake) {
        for (const listener of this.listeners) {
            try {
                listener(earthquake);
            } catch (error) {
                console.error('Error in earthquake listener:', error);
            }
        }
    }
    
    /**
     * Notify all connection listeners of a connection status change
     * @param {string} status - The connection status ('connected', 'connecting', 'disconnected')
     * @private
     */
    _notifyConnectionListeners(status) {
        for (const listener of this.connectionListeners) {
            try {
                listener(status);
            } catch (error) {
                console.error('Error in connection listener:', error);
            }
        }
    }
    
    /**
     * Check if auto-refresh is enabled
     * @returns {boolean} - True if auto-refresh is enabled
     * @private
     */
    _isAutoRefreshEnabled() {
        const autoRefresh = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTO_REFRESH);
        return autoRefresh === null ? CONFIG.DEFAULTS.AUTO_REFRESH : autoRefresh === 'true';
    }
}