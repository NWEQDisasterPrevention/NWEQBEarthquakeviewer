module com.earthquakeviewer {
    requires javafx.controls;
    requires javafx.fxml;
    requires javafx.web;
    requires com.fasterxml.jackson.databind;
    requires okhttp3;
    requires org.java_websocket;
    requires org.jxmapviewer2;
    requires org.slf4j;
    requires ch.qos.logback.classic;
    requires java.desktop;
    
    opens com.earthquakeviewer to javafx.fxml;
    opens com.earthquakeviewer.ui to javafx.fxml;
    opens com.earthquakeviewer.model to javafx.base;
    
    exports com.earthquakeviewer;
    exports com.earthquakeviewer.ui;
    exports com.earthquakeviewer.model;
    exports com.earthquakeviewer.service;
}