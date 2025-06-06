package com.earthquakeviewer.ui;

import com.earthquakeviewer.model.Earthquake;
import com.earthquakeviewer.service.EarthquakeService;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.web.WebView;
import org.jxmapviewer.JXMapViewer;
import org.jxmapviewer.OSMTileFactoryInfo;
import org.jxmapviewer.viewer.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Controller for the main view of the application.
 */
public class MainController {
    private static final Logger logger = LoggerFactory.getLogger(MainController.class);
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");

    @FXML private TabPane tabPane;
    @FXML private TableView<Earthquake> earthquakeTable;
    @FXML private TableColumn<Earthquake, String> timeColumn;
    @FXML private TableColumn<Earthquake, String> locationColumn;
    @FXML private TableColumn<Earthquake, String> magnitudeColumn;
    @FXML private TableColumn<Earthquake, String> depthColumn;
    @FXML private TableColumn<Earthquake, String> intensityColumn;
    @FXML private Label statusLabel;
    @FXML private Slider magnitudeSlider;
    @FXML private ComboBox<String> prefectureComboBox;
    @FXML private DatePicker startDatePicker;
    @FXML private DatePicker endDatePicker;
    @FXML private Button applyFilterButton;
    @FXML private Button resetFilterButton;
    @FXML private WebView detailWebView;
    
    private EarthquakeService earthquakeService;
    private ObservableList<Earthquake> earthquakes = FXCollections.observableArrayList();
    private JXMapViewer mapViewer;
    private Set<Waypoint> waypoints = new HashSet<>();
    private WaypointPainter<Waypoint> waypointPainter = new WaypointPainter<>();
    
    /**
     * Initialize the controller with the earthquake service.
     * 
     * @param earthquakeService The earthquake service to use
     */
    public void initialize(EarthquakeService earthquakeService) {
        this.earthquakeService = earthquakeService;
        
        // Set up the earthquake table
        earthquakeTable.setItems(earthquakes);
        
        timeColumn.setCellValueFactory(cellData -> 
            cellData.getValue().getTimeProperty());
        locationColumn.setCellValueFactory(cellData -> 
            cellData.getValue().getLocationProperty());
        magnitudeColumn.setCellValueFactory(cellData -> 
            cellData.getValue().getMagnitudeProperty());
        depthColumn.setCellValueFactory(cellData -> 
            cellData.getValue().getDepthProperty());
        intensityColumn.setCellValueFactory(cellData -> 
            cellData.getValue().getIntensityProperty());
        
        // Set up the map viewer
        initializeMapViewer();
        
        // Set up the prefecture combo box
        initializePrefectureComboBox();
        
        // Set up the filter controls
        initializeFilterControls();
        
        // Set up the earthquake table selection listener
        earthquakeTable.getSelectionModel().selectedItemProperty().addListener(
            (observable, oldValue, newValue) -> showEarthquakeDetails(newValue));
        
        // Register for earthquake updates
        earthquakeService.addEarthquakeListener(this::handleEarthquakeUpdate);
        
        // Load initial earthquake data
        loadInitialEarthquakeData();
        
        // Update status
        updateStatus("Ready");
    }
    
    private void initializeMapViewer() {
        // Create a TileFactoryInfo for OpenStreetMap
        TileFactoryInfo info = new OSMTileFactoryInfo();
        DefaultTileFactory tileFactory = new DefaultTileFactory(info);
        
        // Setup local file cache
        File cacheDir = new File(System.getProperty("user.home") + File.separator + ".earthquake_viewer" + File.separator + "map_cache");
        tileFactory.setLocalCache(new FileBasedLocalCache(cacheDir, false));
        
        // Create a map viewer
        mapViewer = new JXMapViewer();
        mapViewer.setTileFactory(tileFactory);
        
        // Center the map on Japan
        GeoPosition japan = new GeoPosition(36.2048, 138.2529);
        mapViewer.setZoom(7);
        mapViewer.setAddressLocation(japan);
        
        // Set up the waypoint painter
        waypointPainter.setWaypoints(waypoints);
        mapViewer.setOverlayPainter(waypointPainter);
        
        // Add the map viewer to the UI
        // Note: This would be added to a specific pane in the FXML
    }
    
    private void initializePrefectureComboBox() {
        List<String> prefectures = new ArrayList<>();
        prefectures.add("All Prefectures");
        prefectures.add("Hokkaido");
        prefectures.add("Aomori");
        prefectures.add("Iwate");
        prefectures.add("Miyagi");
        prefectures.add("Akita");
        prefectures.add("Yamagata");
        prefectures.add("Fukushima");
        prefectures.add("Ibaraki");
        prefectures.add("Tochigi");
        prefectures.add("Gunma");
        prefectures.add("Saitama");
        prefectures.add("Chiba");
        prefectures.add("Tokyo");
        prefectures.add("Kanagawa");
        prefectures.add("Niigata");
        prefectures.add("Toyama");
        prefectures.add("Ishikawa");
        prefectures.add("Fukui");
        prefectures.add("Yamanashi");
        prefectures.add("Nagano");
        prefectures.add("Gifu");
        prefectures.add("Shizuoka");
        prefectures.add("Aichi");
        prefectures.add("Mie");
        prefectures.add("Shiga");
        prefectures.add("Kyoto");
        prefectures.add("Osaka");
        prefectures.add("Hyogo");
        prefectures.add("Nara");
        prefectures.add("Wakayama");
        prefectures.add("Tottori");
        prefectures.add("Shimane");
        prefectures.add("Okayama");
        prefectures.add("Hiroshima");
        prefectures.add("Yamaguchi");
        prefectures.add("Tokushima");
        prefectures.add("Kagawa");
        prefectures.add("Ehime");
        prefectures.add("Kochi");
        prefectures.add("Fukuoka");
        prefectures.add("Saga");
        prefectures.add("Nagasaki");
        prefectures.add("Kumamoto");
        prefectures.add("Oita");
        prefectures.add("Miyazaki");
        prefectures.add("Kagoshima");
        prefectures.add("Okinawa");
        
        prefectureComboBox.setItems(FXCollections.observableArrayList(prefectures));
        prefectureComboBox.getSelectionModel().selectFirst();
    }
    
    private void initializeFilterControls() {
        // Set up the magnitude slider
        magnitudeSlider.setMin(0);
        magnitudeSlider.setMax(9);
        magnitudeSlider.setValue(0);
        magnitudeSlider.setShowTickLabels(true);
        magnitudeSlider.setShowTickMarks(true);
        magnitudeSlider.setMajorTickUnit(1);
        magnitudeSlider.setMinorTickCount(0);
        magnitudeSlider.setSnapToTicks(true);
        
        // Set up the filter buttons
        applyFilterButton.setOnAction(event -> applyFilters());
        resetFilterButton.setOnAction(event -> resetFilters());
    }
    
    private void loadInitialEarthquakeData() {
        earthquakeService.getRecentEarthquakes(20)
            .thenAccept(this::updateEarthquakeList)
            .exceptionally(ex -> {
                logger.error("Failed to load initial earthquake data", ex);
                Platform.runLater(() -> updateStatus("Failed to load earthquake data: " + ex.getMessage()));
                return null;
            });
    }
    
    private void handleEarthquakeUpdate(Earthquake earthquake) {
        Platform.runLater(() -> {
            // Add the earthquake to the list
            earthquakes.add(0, earthquake);
            
            // Update the map
            updateMap();
            
            // Show notification
            showNotification(earthquake);
            
            // Update status
            updateStatus("Received new earthquake data: " + earthquake.getLocation() + " (M" + earthquake.getMagnitude() + ")");
        });
    }
    
    private void updateEarthquakeList(List<Earthquake> earthquakeList) {
        Platform.runLater(() -> {
            earthquakes.clear();
            earthquakes.addAll(earthquakeList);
            updateMap();
            updateStatus("Loaded " + earthquakeList.size() + " earthquakes");
        });
    }
    
    private void updateMap() {
        // Clear existing waypoints
        waypoints.clear();
        
        // Add waypoints for each earthquake
        for (Earthquake earthquake : earthquakes) {
            GeoPosition position = new GeoPosition(earthquake.getLatitude(), earthquake.getLongitude());
            Waypoint waypoint = new DefaultWaypoint(position);
            waypoints.add(waypoint);
        }
        
        // Update the waypoint painter
        waypointPainter.setWaypoints(waypoints);
        mapViewer.repaint();
    }
    
    private void showEarthquakeDetails(Earthquake earthquake) {
        if (earthquake == null) {
            detailWebView.getEngine().loadContent("<html><body><h2>No earthquake selected</h2></body></html>");
            return;
        }
        
        StringBuilder html = new StringBuilder();
        html.append("<html><body style='font-family: Arial, sans-serif;'>");
        html.append("<h2>").append(earthquake.getLocation()).append("</h2>");
        html.append("<p><strong>Time:</strong> ").append(earthquake.getTime()).append("</p>");
        html.append("<p><strong>Magnitude:</strong> ").append(earthquake.getMagnitude()).append("</p>");
        html.append("<p><strong>Depth:</strong> ").append(earthquake.getDepth()).append(" km</p>");
        html.append("<p><strong>Maximum Intensity:</strong> ").append(earthquake.getIntensity()).append("</p>");
        
        // Add affected areas if available
        if (earthquake.getAffectedAreas() != null && !earthquake.getAffectedAreas().isEmpty()) {
            html.append("<h3>Affected Areas:</h3>");
            html.append("<ul>");
            for (String area : earthquake.getAffectedAreas()) {
                html.append("<li>").append(area).append("</li>");
            }
            html.append("</ul>");
        }
        
        html.append("</body></html>");
        
        detailWebView.getEngine().loadContent(html.toString());
    }
    
    private void showNotification(Earthquake earthquake) {
        // Create and show a notification
        // This would be implemented using a custom notification system or JavaFX Alert
    }
    
    private void applyFilters() {
        double minMagnitude = magnitudeSlider.getValue();
        String prefecture = prefectureComboBox.getValue();
        LocalDateTime startDate = startDatePicker.getValue() != null ? 
            startDatePicker.getValue().atStartOfDay() : null;
        LocalDateTime endDate = endDatePicker.getValue() != null ? 
            endDatePicker.getValue().atTime(23, 59, 59) : null;
        
        earthquakeService.getFilteredEarthquakes(minMagnitude, prefecture, startDate, endDate)
            .thenAccept(this::updateEarthquakeList)
            .exceptionally(ex -> {
                logger.error("Failed to apply filters", ex);
                Platform.runLater(() -> updateStatus("Failed to apply filters: " + ex.getMessage()));
                return null;
            });
    }
    
    private void resetFilters() {
        magnitudeSlider.setValue(0);
        prefectureComboBox.getSelectionModel().selectFirst();
        startDatePicker.setValue(null);
        endDatePicker.setValue(null);
        
        loadInitialEarthquakeData();
    }
    
    private void updateStatus(String message) {
        statusLabel.setText(message + " - " + LocalDateTime.now().format(DATE_TIME_FORMATTER));
    }
}