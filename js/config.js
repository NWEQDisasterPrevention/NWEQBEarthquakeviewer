/**
 * Configuration settings for the Japan Earthquake Viewer
 */
const CONFIG = {
    // API endpoints
    API: {
        BASE_URL: 'https://api.p2pquake.net/v2',
        WEBSOCKET_URL: 'wss://api-realtime.p2pquake.net/v2/ws',
        HISTORY_ENDPOINT: '/history',
        JMA_QUAKE_ENDPOINT: '/jma/quake'
    },
    
    // Map settings
    MAP: {
        DEFAULT_CENTER: [36.2048, 138.2529], // Center of Japan
        DEFAULT_ZOOM: 5,
        TILE_LAYER: {
            STREETS: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            SATELLITE: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            HYBRID: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        },
        ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    
    // Default settings
    DEFAULTS: {
        THEME: 'light', // light, dark, auto
        MAP_STYLE: 'streets', // streets, satellite, hybrid
        NOTIFICATIONS: {
            ENABLED: true,
            MIN_MAGNITUDE: 4.0,
            SOUND: true
        },
        AUTO_REFRESH: true,
        MAX_EARTHQUAKES: 100
    },
    
    // Prefectures of Japan
    PREFECTURES: [
        'Hokkaido', 'Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima',
        'Ibaraki', 'Tochigi', 'Gunma', 'Saitama', 'Chiba', 'Tokyo', 'Kanagawa',
        'Niigata', 'Toyama', 'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano',
        'Gifu', 'Shizuoka', 'Aichi', 'Mie', 'Shiga', 'Kyoto', 'Osaka', 'Hyogo',
        'Nara', 'Wakayama', 'Tottori', 'Shimane', 'Okayama', 'Hiroshima', 'Yamaguchi',
        'Tokushima', 'Kagawa', 'Ehime', 'Kochi', 'Fukuoka', 'Saga', 'Nagasaki',
        'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa'
    ],
    
    // JMA intensity scale mapping
    INTENSITY_SCALE: {
        '10': '1',
        '20': '2',
        '30': '3',
        '40': '4',
        '45': '5-',
        '50': '5+',
        '55': '6-',
        '60': '6+',
        '70': '7'
    },
    
    // Intensity to CSS class mapping
    INTENSITY_CLASS: {
        '1': 'intensity-1',
        '2': 'intensity-2',
        '3': 'intensity-3',
        '4': 'intensity-4',
        '5-': 'intensity-5-minus',
        '5+': 'intensity-5-plus',
        '6-': 'intensity-6-minus',
        '6+': 'intensity-6-plus',
        '7': 'intensity-7'
    },
    
    // Magnitude to marker size mapping
    MAGNITUDE_TO_SIZE: {
        // Magnitude: [size in pixels, border width]
        0: [10, 1],
        1: [12, 1],
        2: [14, 1],
        3: [16, 1],
        4: [20, 2],
        5: [25, 2],
        6: [30, 2],
        7: [35, 3],
        8: [40, 3],
        9: [45, 3]
    },
    
    // Local storage keys
    STORAGE_KEYS: {
        THEME: 'earthquake-viewer-theme',
        MAP_STYLE: 'earthquake-viewer-map-style',
        NOTIFICATIONS_ENABLED: 'earthquake-viewer-notifications-enabled',
        NOTIFICATIONS_MIN_MAGNITUDE: 'earthquake-viewer-notifications-min-magnitude',
        NOTIFICATIONS_SOUND: 'earthquake-viewer-notifications-sound',
        AUTO_REFRESH: 'earthquake-viewer-auto-refresh'
    }
};