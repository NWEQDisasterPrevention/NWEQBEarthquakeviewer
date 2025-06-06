/**
 * Main application logic for the Japan Earthquake Viewer
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize services
    const api = new EarthquakeAPI();
    const map = new EarthquakeMap('map');
    const notificationService = new NotificationService();
    
    // DOM elements
    const earthquakeList = document.getElementById('earthquake-list');
    const historyList = document.getElementById('history-list');
    const earthquakeDetails = document.getElementById('earthquake-details');
    const connectionStatus = document.getElementById('connection-status');
    const lastUpdate = document.getElementById('last-update');
    const minMagnitudeSlider = document.getElementById('min-magnitude');
    const magnitudeValue = document.getElementById('magnitude-value');
    const prefectureSelect = document.getElementById('prefecture-select');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const searchBtn = document.getElementById('search-btn');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const notificationMagnitudeSlider = document.getElementById('notification-magnitude');
    const notificationMagnitudeValue = document.getElementById('notification-magnitude-value');
    const enableNotificationsCheckbox = document.getElementById('enable-notifications');
    const notificationSoundCheckbox = document.getElementById('notification-sound');
    const themeSelect = document.getElementById('theme-select');
    const mapStyleSelect = document.getElementById('map-style');
    const autoRefreshCheckbox = document.getElementById('auto-refresh');
    const notificationSettingsForm = document.getElementById('notification-settings-form');
    const displaySettingsForm = document.getElementById('display-settings-form');
    
    // Current state
    let currentEarthquakes = [];
    let selectedEarthquakeId = null;
    
    // Initialize the application
    function initialize() {
        // Initialize map
        map.initialize();
        
        // Initialize notifications
        notificationService.initialize();
        
        // Populate prefecture select
        populatePrefectureSelect();
        
        // Load settings
        loadSettings();
        
        // Set up event listeners
        setupEventListeners();
        
        // Connect to WebSocket for real-time updates
        if (isAutoRefreshEnabled()) {
            api.connectWebSocket();
        }
        
        // Load initial earthquake data
        loadInitialEarthquakeData();
    }
    
    // Populate the prefecture select dropdown
    function populatePrefectureSelect() {
        for (const prefecture of CONFIG.PREFECTURES) {
            const option = document.createElement('option');
            option.value = prefecture;
            option.textContent = prefecture;
            prefectureSelect.appendChild(option);
        }
    }
    
    // Load settings from local storage
    function loadSettings() {
        // Load theme
        const theme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || CONFIG.DEFAULTS.THEME;
        themeSelect.value = theme;
        applyTheme(theme);
        
        // Load map style
        const mapStyle = localStorage.getItem(CONFIG.STORAGE_KEYS.MAP_STYLE) || CONFIG.DEFAULTS.MAP_STYLE;
        mapStyleSelect.value = mapStyle;
        
        // Load notification settings
        const notificationSettings = notificationService.getSettings();
        enableNotificationsCheckbox.checked = notificationSettings.enabled;
        notificationMagnitudeSlider.value = notificationSettings.minMagnitude;
        notificationMagnitudeValue.textContent = notificationSettings.minMagnitude;
        notificationSoundCheckbox.checked = notificationSettings.sound;
        
        // Load auto-refresh setting
        const autoRefresh = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTO_REFRESH);
        autoRefreshCheckbox.checked = autoRefresh === null ? CONFIG.DEFAULTS.AUTO_REFRESH : autoRefresh === 'true';
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // API connection status listener
        api.addConnectionListener(handleConnectionStatus);
        
        // Earthquake listener
        api.addEarthquakeListener(handleNewEarthquake);
        
        // Tab change listener
        document.getElementById('map-tab').addEventListener('shown.bs.tab', () => {
            map.map.invalidateSize();
        });
        
        // Magnitude slider
        minMagnitudeSlider.addEventListener('input', () => {
            magnitudeValue.textContent = minMagnitudeSlider.value;
        });
        
        // Notification magnitude slider
        notificationMagnitudeSlider.addEventListener('input', () => {
            notificationMagnitudeValue.textContent = notificationMagnitudeSlider.value;
        });
        
        // Search form
        searchBtn.addEventListener('click', handleSearch);
        resetFiltersBtn.addEventListener('click', resetFilters);
        
        // Notification settings form
        notificationSettingsForm.addEventListener('submit', (event) => {
            event.preventDefault();
            saveNotificationSettings();
        });
        
        // Display settings form
        displaySettingsForm.addEventListener('submit', (event) => {
            event.preventDefault();
            saveDisplaySettings();
        });
        
        // View earthquake details event
        document.addEventListener('viewEarthquakeDetails', (event) => {
            const id = event.detail.id;
            viewEarthquakeDetails(id);
        });
    }
    
    // Load initial earthquake data
    function loadInitialEarthquakeData() {
        updateStatus('Loading earthquake data...');
        
        api.getRecentEarthquakes(CONFIG.DEFAULTS.MAX_EARTHQUAKES)
            .then(earthquakes => {
                currentEarthquakes = earthquakes;
                updateEarthquakeList(earthquakes);
                map.updateMap(earthquakes);
                updateStatus('Earthquake data loaded successfully');
            })
            .catch(error => {
                console.error('Error loading initial earthquake data:', error);
                updateStatus('Error loading earthquake data');
            });
    }
    
    // Handle new earthquake from WebSocket
    function handleNewEarthquake(earthquake) {
        // Add to current earthquakes
        currentEarthquakes.unshift(earthquake);
        
        // Limit the number of earthquakes
        if (currentEarthquakes.length > CONFIG.DEFAULTS.MAX_EARTHQUAKES) {
            currentEarthquakes.pop();
        }
        
        // Update the UI
        updateEarthquakeList(currentEarthquakes);
        map.addEarthquake(earthquake);
        
        // Show notification
        notificationService.showNotification(earthquake);
        
        // Update status
        updateStatus('New earthquake received');
    }
    
    // Update the earthquake list
    function updateEarthquakeList(earthquakes) {
        // Clear the list
        earthquakeList.innerHTML = '';
        
        // Add earthquakes to the list
        if (earthquakes.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5" class="text-center">No earthquakes found</td>';
            earthquakeList.appendChild(row);
            return;
        }
        
        for (const earthquake of earthquakes) {
            const row = createEarthquakeRow(earthquake);
            earthquakeList.appendChild(row);
        }
    }
    
    // Create a table row for an earthquake
    function createEarthquakeRow(earthquake) {
        const row = document.createElement('tr');
        row.dataset.id = earthquake.id;
        
        // Get earthquake data
        const time = earthquake.earthquake.time;
        const location = earthquake.earthquake.hypocenter.name;
        const magnitude = earthquake.earthquake.hypocenter.magnitude || 0;
        const depth = earthquake.earthquake.hypocenter.depth || 0;
        
        // Get intensity
        let intensity = 'Unknown';
        let intensityClass = '';
        if (earthquake.earthquake.maxScale) {
            intensity = CONFIG.INTENSITY_SCALE[earthquake.earthquake.maxScale] || 'Unknown';
            intensityClass = CONFIG.INTENSITY_CLASS[intensity] || '';
        }
        
        // Create cells
        row.innerHTML = `
            <td>${time}</td>
            <td>${location}</td>
            <td>${magnitude.toFixed(1)}</td>
            <td>${depth} km</td>
            <td class="${intensityClass}">${intensity}</td>
        `;
        
        // Add click event
        row.addEventListener('click', () => {
            viewEarthquakeDetails(earthquake.id);
        });
        
        return row;
    }
    
    // View earthquake details
    function viewEarthquakeDetails(id) {
        // Find the earthquake
        const earthquake = currentEarthquakes.find(eq => eq.id === id);
        if (!earthquake) {
            return;
        }
        
        // Update selected earthquake
        selectedEarthquakeId = id;
        
        // Highlight the selected row
        const rows = document.querySelectorAll('#earthquake-list tr, #history-list tr');
        rows.forEach(row => {
            row.classList.remove('table-primary');
            if (row.dataset.id === id) {
                row.classList.add('table-primary');
            }
        });
        
        // Show details
        showEarthquakeDetails(earthquake);
        
        // Focus on the map
        map.focusEarthquake(id);
        
        // Switch to details tab if on mobile
        if (window.innerWidth < 768) {
            bootstrap.Tab.getOrCreateInstance(document.getElementById('list-tab')).show();
        }
    }
    
    // Show earthquake details
    function showEarthquakeDetails(earthquake) {
        // Get earthquake data
        const time = earthquake.earthquake.time;
        const location = earthquake.earthquake.hypocenter.name;
        const magnitude = earthquake.earthquake.hypocenter.magnitude || 0;
        const depth = earthquake.earthquake.hypocenter.depth || 0;
        const latitude = earthquake.earthquake.hypocenter.latitude;
        const longitude = earthquake.earthquake.hypocenter.longitude;
        
        // Get intensity
        let intensity = 'Unknown';
        let intensityClass = '';
        if (earthquake.earthquake.maxScale) {
            intensity = CONFIG.INTENSITY_SCALE[earthquake.earthquake.maxScale] || 'Unknown';
            intensityClass = CONFIG.INTENSITY_CLASS[intensity] || '';
        }
        
        // Get tsunami information
        let tsunami = 'None';
        if (earthquake.earthquake.domesticTsunami && earthquake.earthquake.domesticTsunami !== 'None') {
            tsunami = earthquake.earthquake.domesticTsunami;
        }
        
        // Create details HTML
        let html = `
            <div class="earthquake-details">
                <h4>${location}</h4>
                <div class="row mb-3">
                    <div class="col-6">
                        <div class="card">
                            <div class="card-body text-center">
                                <h5 class="card-title">Magnitude</h5>
                                <p class="card-text display-4">${magnitude.toFixed(1)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="card">
                            <div class="card-body text-center ${intensityClass}">
                                <h5 class="card-title">Intensity</h5>
                                <p class="card-text display-4">${intensity}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <table class="table table-striped">
                    <tr>
                        <th>Time</th>
                        <td>${time}</td>
                    </tr>
                    <tr>
                        <th>Depth</th>
                        <td>${depth} km</td>
                    </tr>
                    <tr>
                        <th>Location</th>
                        <td>${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E</td>
                    </tr>
                    <tr>
                        <th>Tsunami</th>
                        <td>${tsunami}</td>
                    </tr>
                </table>
        `;
        
        // Add affected areas if available
        if (earthquake.points && earthquake.points.length > 0) {
            html += `
                <h5 class="mt-3">Affected Areas</h5>
                <div class="table-responsive">
                    <table class="table table-sm table-striped">
                        <thead>
                            <tr>
                                <th>Area</th>
                                <th>Intensity</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            for (const point of earthquake.points) {
                const pointIntensity = CONFIG.INTENSITY_SCALE[point.scale] || 'Unknown';
                const pointIntensityClass = CONFIG.INTENSITY_CLASS[pointIntensity] || '';
                
                html += `
                    <tr>
                        <td>${point.addr}</td>
                        <td class="${pointIntensityClass}">${pointIntensity}</td>
                    </tr>
                `;
            }
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        html += '</div>';
        
        // Update the details element
        earthquakeDetails.innerHTML = html;
    }
    
    // Handle search
    function handleSearch() {
        const minMagnitude = parseFloat(minMagnitudeSlider.value);
        const prefecture = prefectureSelect.value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        updateStatus('Searching for earthquakes...');
        
        api.getFilteredEarthquakes({
            minMagnitude,
            prefecture,
            startDate,
            endDate,
            limit: CONFIG.DEFAULTS.MAX_EARTHQUAKES
        })
            .then(earthquakes => {
                // Update history list
                updateHistoryList(earthquakes);
                updateStatus(`Found ${earthquakes.length} earthquakes`);
            })
            .catch(error => {
                console.error('Error searching for earthquakes:', error);
                updateStatus('Error searching for earthquakes');
            });
    }
    
    // Update the history list
    function updateHistoryList(earthquakes) {
        // Clear the list
        historyList.innerHTML = '';
        
        // Add earthquakes to the list
        if (earthquakes.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5" class="text-center">No earthquakes found</td>';
            historyList.appendChild(row);
            return;
        }
        
        for (const earthquake of earthquakes) {
            const row = createEarthquakeRow(earthquake);
            historyList.appendChild(row);
        }
    }
    
    // Reset filters
    function resetFilters() {
        minMagnitudeSlider.value = 0;
        magnitudeValue.textContent = '0';
        prefectureSelect.value = '';
        startDateInput.value = '';
        endDateInput.value = '';
        
        // Clear history list
        historyList.innerHTML = '<tr><td colspan="5" class="text-center">Use the search form above to find historical earthquake data</td></tr>';
    }
    
    // Save notification settings
    function saveNotificationSettings() {
        const enabled = enableNotificationsCheckbox.checked;
        const minMagnitude = parseFloat(notificationMagnitudeSlider.value);
        const sound = notificationSoundCheckbox.checked;
        
        notificationService.updateSettings({
            enabled,
            minMagnitude,
            sound
        });
        
        updateStatus('Notification settings saved');
    }
    
    // Save display settings
    function saveDisplaySettings() {
        const theme = themeSelect.value;
        const mapStyle = mapStyleSelect.value;
        const autoRefresh = autoRefreshCheckbox.checked;
        
        // Save theme
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
        applyTheme(theme);
        
        // Save map style
        map.updateMapStyle(mapStyle);
        
        // Save auto-refresh
        localStorage.setItem(CONFIG.STORAGE_KEYS.AUTO_REFRESH, autoRefresh);
        
        // Update WebSocket connection based on auto-refresh setting
        if (autoRefresh) {
            api.connectWebSocket();
        } else {
            api.disconnectWebSocket();
        }
        
        updateStatus('Display settings saved');
    }
    
    // Apply theme
    function applyTheme(theme) {
        document.body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
        document.body.classList.add(`theme-${theme}`);
    }
    
    // Handle connection status
    function handleConnectionStatus(status) {
        connectionStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        connectionStatus.className = `badge ${status === 'connected' ? 'bg-success' : status === 'connecting' ? 'bg-warning' : 'bg-danger'}`;
    }
    
    // Update status
    function updateStatus(message) {
        lastUpdate.textContent = `${message} - ${new Date().toLocaleTimeString()}`;
    }
    
    // Check if auto-refresh is enabled
    function isAutoRefreshEnabled() {
        const autoRefresh = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTO_REFRESH);
        return autoRefresh === null ? CONFIG.DEFAULTS.AUTO_REFRESH : autoRefresh === 'true';
    }
    
    // Initialize the application
    initialize();
});