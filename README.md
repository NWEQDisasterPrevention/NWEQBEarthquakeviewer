# Japan Real-time Earthquake Viewer

A web application for monitoring and visualizing real-time earthquake data in Japan using the P2P Quake API.

## Features

- **Real-time Earthquake Notifications**: Receive instant notifications when earthquakes occur in Japan
- **Map Visualization**: View earthquake locations on an interactive map
- **Historical Data Browsing**: Browse and search through past earthquake data
- **Filtering Capabilities**: Filter earthquakes by magnitude, location, and date
- **Detailed Information**: Access detailed information about each earthquake event

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- Web server for hosting (optional for local use)

### Installation

 **Required Files**:
   - Add a notification sound file at `sounds/notification.mp3`
   - Add an earthquake icon at `img/earthquake-icon.png`
   - Add a favicon at `img/favicon.ico`

## Usage

1. **Main View**:
   - The main view shows a list of recent earthquakes
   - Click on an earthquake to view detailed information

2. **Map View**:
   - Switch to the Map tab to view earthquake locations
   - Click on markers to see earthquake details
   - Use mouse wheel to zoom in/out

3. **Historical Data**:
   - Use the Historical Data tab to search for past earthquakes
   - Filter by magnitude, prefecture, and date range

4. **Settings**:
   - Configure notification preferences
   - Change display settings like theme and map style

## How It Works

This application uses the following technologies:

- **HTML5/CSS3/JavaScript**: Core web technologies
- **Bootstrap 5**: For responsive layout and UI components
- **Leaflet.js**: For interactive maps
- **P2P Quake API**: For earthquake data
  - REST API for historical data
  - WebSocket for real-time updates

## Data Source

This application uses the [P2P Quake API](https://www.p2pquake.net/) to fetch earthquake data. The API provides real-time earthquake information from the Japan Meteorological Agency (JMA) and user reports.

## Customization

### Adding Custom Icons

1. Replace the placeholder files in the `img` directory with your own icons
2. Make sure to keep the same filenames or update the references in the code

### Changing the Notification Sound

1. Replace the placeholder file in the `sounds` directory with your own sound
2. Make sure to keep the same filename or update the reference in the code

### Modifying the Theme

1. Edit the `css/styles.css` file to change colors and styles
2. The application supports light, dark, and auto (system-based) themes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.txt) file for details.

## Acknowledgments

- [P2P Quake](https://www.p2pquake.net/) for providing the earthquake data API
- [Leaflet](https://leafletjs.com/) for the map visualization
- [Bootstrap](https://getbootstrap.com/) for the UI framework
- [OpenStreetMap](https://www.openstreetmap.org/) for map data
