/**
 * Notification service for displaying earthquake notifications
 */
class NotificationService {
    constructor() {
        this.notificationSound = new Audio('sounds/notification.mp3');
        this.settings = this._loadSettings();
    }
    
    /**
     * Initialize the notification service
     */
    initialize() {
        // Request notification permission if enabled
        if (this.settings.enabled) {
            this._requestNotificationPermission();
        }
    }
    
    /**
     * Show a notification for a new earthquake
     * @param {Object} earthquake - The earthquake data
     */
    showNotification(earthquake) {
        // Skip if notifications are disabled
        if (!this.settings.enabled) {
            return;
        }
        
        // Skip if the earthquake doesn't meet the minimum magnitude
        const magnitude = earthquake.earthquake.hypocenter.magnitude || 0;
        if (magnitude < this.settings.minMagnitude) {
            return;
        }
        
        // Get earthquake details
        const location = earthquake.earthquake.hypocenter.name;
        const time = earthquake.earthquake.time;
        
        // Get intensity
        let intensity = 'Unknown';
        if (earthquake.earthquake.maxScale) {
            intensity = CONFIG.INTENSITY_SCALE[earthquake.earthquake.maxScale] || 'Unknown';
        }
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
            const notification = new Notification('Earthquake Alert', {
                body: `${location} - M${magnitude.toFixed(1)} - Intensity: ${intensity}`,
                icon: 'img/earthquake-icon.png'
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
                
                // Trigger a custom event to view earthquake details
                const event = new CustomEvent('viewEarthquakeDetails', { detail: { id: earthquake.id } });
                document.dispatchEvent(event);
            };
        }
        
        // Show toast notification
        this._showToast(earthquake);
        
        // Play sound if enabled
        if (this.settings.sound) {
            this._playNotificationSound();
        }
    }
    
    /**
     * Update notification settings
     * @param {Object} settings - The new settings
     * @param {boolean} settings.enabled - Whether notifications are enabled
     * @param {number} settings.minMagnitude - The minimum magnitude for notifications
     * @param {boolean} settings.sound - Whether to play a sound with notifications
     */
    updateSettings(settings) {
        this.settings = {
            ...this.settings,
            ...settings
        };
        
        // Save settings to local storage
        localStorage.setItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS_ENABLED, this.settings.enabled);
        localStorage.setItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS_MIN_MAGNITUDE, this.settings.minMagnitude);
        localStorage.setItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS_SOUND, this.settings.sound);
        
        // Request notification permission if enabled
        if (this.settings.enabled) {
            this._requestNotificationPermission();
        }
    }
    
    /**
     * Get the current notification settings
     * @returns {Object} - The current settings
     */
    getSettings() {
        return { ...this.settings };
    }
    
    /**
     * Show a toast notification
     * @param {Object} earthquake - The earthquake data
     * @private
     */
    _showToast(earthquake) {
        const magnitude = earthquake.earthquake.hypocenter.magnitude || 0;
        const location = earthquake.earthquake.hypocenter.name;
        const time = earthquake.earthquake.time;
        
        // Get intensity
        let intensity = 'Unknown';
        if (earthquake.earthquake.maxScale) {
            intensity = CONFIG.INTENSITY_SCALE[earthquake.earthquake.maxScale] || 'Unknown';
        }
        
        // Update toast content
        const toastTime = document.getElementById('toast-time');
        const toastBody = document.getElementById('toast-body');
        
        toastTime.textContent = new Date().toLocaleTimeString();
        toastBody.innerHTML = `
            <strong>${location}</strong><br>
            Magnitude: ${magnitude.toFixed(1)}<br>
            Intensity: ${intensity}<br>
            Time: ${time}
        `;
        
        // Show the toast
        const toast = bootstrap.Toast.getOrCreateInstance(document.getElementById('earthquake-toast'));
        toast.show();
    }
    
    /**
     * Play the notification sound
     * @private
     */
    _playNotificationSound() {
        this.notificationSound.currentTime = 0;
        this.notificationSound.play().catch(error => {
            console.error('Error playing notification sound:', error);
        });
    }
    
    /**
     * Request permission for browser notifications
     * @private
     */
    _requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notifications');
            return;
        }
        
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }
    
    /**
     * Load notification settings from local storage
     * @returns {Object} - The loaded settings
     * @private
     */
    _loadSettings() {
        const enabled = localStorage.getItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS_ENABLED);
        const minMagnitude = localStorage.getItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS_MIN_MAGNITUDE);
        const sound = localStorage.getItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS_SOUND);
        
        return {
            enabled: enabled === null ? CONFIG.DEFAULTS.NOTIFICATIONS.ENABLED : enabled === 'true',
            minMagnitude: minMagnitude === null ? CONFIG.DEFAULTS.NOTIFICATIONS.MIN_MAGNITUDE : parseFloat(minMagnitude),
            sound: sound === null ? CONFIG.DEFAULTS.NOTIFICATIONS.SOUND : sound === 'true'
        };
    }
}