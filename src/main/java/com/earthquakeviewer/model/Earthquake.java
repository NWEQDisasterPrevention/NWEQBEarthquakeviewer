package com.earthquakeviewer.model;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Model class representing earthquake data.
 */
public class Earthquake {
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");
    
    private String id;
    private LocalDateTime time;
    private String location;
    private double latitude;
    private double longitude;
    private double magnitude;
    private int depth;
    private String intensity;
    private List<String> affectedAreas;
    
    // Properties for JavaFX TableView
    private final StringProperty timeProperty = new SimpleStringProperty();
    private final StringProperty locationProperty = new SimpleStringProperty();
    private final StringProperty magnitudeProperty = new SimpleStringProperty();
    private final StringProperty depthProperty = new SimpleStringProperty();
    private final StringProperty intensityProperty = new SimpleStringProperty();
    
    public Earthquake() {
    }
    
    public Earthquake(String id, LocalDateTime time, String location, double latitude, double longitude, 
                     double magnitude, int depth, String intensity, List<String> affectedAreas) {
        this.id = id;
        this.time = time;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.magnitude = magnitude;
        this.depth = depth;
        this.intensity = intensity;
        this.affectedAreas = affectedAreas;
        
        // Initialize properties
        updateProperties();
    }
    
    private void updateProperties() {
        timeProperty.set(time.format(DATE_TIME_FORMATTER));
        locationProperty.set(location);
        magnitudeProperty.set(String.format("%.1f", magnitude));
        depthProperty.set(depth + " km");
        intensityProperty.set(intensity);
    }
    
    // Getters and setters
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public LocalDateTime getTime() {
        return time;
    }
    
    public void setTime(LocalDateTime time) {
        this.time = time;
        timeProperty.set(time.format(DATE_TIME_FORMATTER));
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
        locationProperty.set(location);
    }
    
    public double getLatitude() {
        return latitude;
    }
    
    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }
    
    public double getLongitude() {
        return longitude;
    }
    
    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }
    
    public double getMagnitude() {
        return magnitude;
    }
    
    public void setMagnitude(double magnitude) {
        this.magnitude = magnitude;
        magnitudeProperty.set(String.format("%.1f", magnitude));
    }
    
    public int getDepth() {
        return depth;
    }
    
    public void setDepth(int depth) {
        this.depth = depth;
        depthProperty.set(depth + " km");
    }
    
    public String getIntensity() {
        return intensity;
    }
    
    public void setIntensity(String intensity) {
        this.intensity = intensity;
        intensityProperty.set(intensity);
    }
    
    public List<String> getAffectedAreas() {
        return affectedAreas;
    }
    
    public void setAffectedAreas(List<String> affectedAreas) {
        this.affectedAreas = affectedAreas;
    }
    
    // Property getters for TableView
    
    public StringProperty getTimeProperty() {
        return timeProperty;
    }
    
    public StringProperty getLocationProperty() {
        return locationProperty;
    }
    
    public StringProperty getMagnitudeProperty() {
        return magnitudeProperty;
    }
    
    public StringProperty getDepthProperty() {
        return depthProperty;
    }
    
    public StringProperty getIntensityProperty() {
        return intensityProperty;
    }
    
    @Override
    public String toString() {
        return "Earthquake{" +
                "id='" + id + '\'' +
                ", time=" + time +
                ", location='" + location + '\'' +
                ", magnitude=" + magnitude +
                ", depth=" + depth +
                ", intensity='" + intensity + '\'' +
                '}';
    }
}