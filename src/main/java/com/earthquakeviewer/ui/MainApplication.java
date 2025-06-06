package com.earthquakeviewer.ui;

import com.earthquakeviewer.service.EarthquakeService;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.stage.Stage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Objects;

/**
 * Main JavaFX Application class that initializes the UI and services.
 */
public class MainApplication extends Application {
    private static final Logger logger = LoggerFactory.getLogger(MainApplication.class);
    private EarthquakeService earthquakeService;

    @Override
    public void start(Stage primaryStage) {
        try {
            // Initialize the earthquake service
            earthquakeService = new EarthquakeService();
            
            // Load the main FXML
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/MainView.fxml"));
            Parent root = loader.load();
            
            // Get the controller and initialize it with the service
            MainController controller = loader.getController();
            controller.initialize(earthquakeService);
            
            // Set up the primary stage
            primaryStage.setTitle("Japan Real-time Earthquake Viewer");
            primaryStage.getIcons().add(new Image(Objects.requireNonNull(getClass().getResourceAsStream("/images/app_icon.png"))));
            primaryStage.setScene(new Scene(root, 1024, 768));
            primaryStage.setMinWidth(800);
            primaryStage.setMinHeight(600);
            primaryStage.show();
            
            // Handle application close
            primaryStage.setOnCloseRequest(event -> {
                shutdown();
            });
            
            // Start the earthquake service
            earthquakeService.start();
            
        } catch (IOException e) {
            logger.error("Failed to start application", e);
            Platform.exit();
        }
    }
    
    @Override
    public void stop() {
        shutdown();
    }
    
    private void shutdown() {
        if (earthquakeService != null) {
            earthquakeService.shutdown();
        }
        Platform.exit();
    }
}