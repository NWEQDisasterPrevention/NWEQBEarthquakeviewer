package com.earthquakeviewer.service;

import com.earthquakeviewer.model.Earthquake;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.function.Consumer;

/**
 * Service for fetching earthquake data from the P2P Quake API.
 */
public class EarthquakeService {
    private static final Logger logger = LoggerFactory.getLogger(EarthquakeService.class);
    private static final String API_BASE_URL = "https://api.p2pquake.net/v2";
    private static final String WEBSOCKET_URL = "wss://api-realtime.p2pquake.net/v2/ws";
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");
    
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final ExecutorService executorService;
    private final List<Consumer<Earthquake>> earthquakeListeners = new CopyOnWriteArrayList<>();
    private WebSocketClient webSocketClient;
    
    public EarthquakeService() {
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build();
        this.objectMapper = new ObjectMapper();
        this.executorService = Executors.newCachedThreadPool();
    }
    
    /**
     * Start the earthquake service and connect to the WebSocket for real-time updates.
     */
    public void start() {
        connectWebSocket();
    }
    
    /**
     * Shutdown the earthquake service and clean up resources.
     */
    public void shutdown() {
        if (webSocketClient != null) {
            webSocketClient.close();
        }
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(5, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
    
    /**
     * Add a listener for earthquake updates.
     * 
     * @param listener The listener to add
     */
    public void addEarthquakeListener(Consumer<Earthquake> listener) {
        earthquakeListeners.add(listener);
    }
    
    /**
     * Remove an earthquake listener.
     * 
     * @param listener The listener to remove
     */
    public void removeEarthquakeListener(Consumer<Earthquake> listener) {
        earthquakeListeners.remove(listener);
    }
    
    /**
     * Get recent earthquakes.
     * 
     * @param limit The maximum number of earthquakes to return
     * @return A CompletableFuture that will be completed with the list of earthquakes
     */
    public CompletableFuture<List<Earthquake>> getRecentEarthquakes(int limit) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String url = API_BASE_URL + "/history?codes=551&limit=" + limit;
                Request request = new Request.Builder()
                        .url(url)
                        .build();
                
                try (Response response = httpClient.newCall(request).execute()) {
                    if (!response.isSuccessful()) {
                        throw new IOException("Unexpected response code: " + response);
                    }
                    
                    String responseBody = response.body().string();
                    JsonNode rootNode = objectMapper.readTree(responseBody);
                    
                    List<Earthquake> earthquakes = new ArrayList<>();
                    for (JsonNode node : rootNode) {
                        if (node.has("code") && node.get("code").asInt() == 551) {
                            earthquakes.add(parseEarthquake(node));
                        }
                    }
                    
                    return earthquakes;
                }
            } catch (Exception e) {
                logger.error("Failed to get recent earthquakes", e);
                throw new CompletionException(e);
            }
        }, executorService);
    }
    
    /**
     * Get filtered earthquakes based on criteria.
     * 
     * @param minMagnitude The minimum magnitude
     * @param prefecture The prefecture to filter by, or "All Prefectures" for no filter
     * @param startDate The start date, or null for no start date
     * @param endDate The end date, or null for no end date
     * @return A CompletableFuture that will be completed with the list of earthquakes
     */
    public CompletableFuture<List<Earthquake>> getFilteredEarthquakes(
            double minMagnitude, String prefecture, LocalDateTime startDate, LocalDateTime endDate) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                StringBuilder urlBuilder = new StringBuilder(API_BASE_URL + "/jma/quake?");
                
                // Add magnitude filter
                if (minMagnitude > 0) {
                    urlBuilder.append("minMagnitude=").append(minMagnitude).append("&");
                }
                
                // Add prefecture filter
                if (prefecture != null && !prefecture.equals("All Prefectures")) {
                    urlBuilder.append("prefecture=").append(prefecture).append("&");
                }
                
                // Add date filters
                if (startDate != null) {
                    urlBuilder.append("sinceDate=").append(startDate.format(DateTimeFormatter.ISO_DATE)).append("&");
                }
                
                if (endDate != null) {
                    urlBuilder.append("untilDate=").append(endDate.format(DateTimeFormatter.ISO_DATE)).append("&");
                }
                
                // Add limit
                urlBuilder.append("limit=100");
                
                Request request = new Request.Builder()
                        .url(urlBuilder.toString())
                        .build();
                
                try (Response response = httpClient.newCall(request).execute()) {
                    if (!response.isSuccessful()) {
                        throw new IOException("Unexpected response code: " + response);
                    }
                    
                    String responseBody = response.body().string();
                    JsonNode rootNode = objectMapper.readTree(responseBody);
                    
                    List<Earthquake> earthquakes = new ArrayList<>();
                    for (JsonNode node : rootNode) {
                        earthquakes.add(parseJMAEarthquake(node));
                    }
                    
                    return earthquakes;
                }
            } catch (Exception e) {
                logger.error("Failed to get filtered earthquakes", e);
                throw new CompletionException(e);
            }
        }, executorService);
    }
    
    private void connectWebSocket() {
        try {
            webSocketClient = new WebSocketClient(new URI(WEBSOCKET_URL)) {
                @Override
                public void onOpen(ServerHandshake handshakedata) {
                    logger.info("WebSocket connection opened");
                }
                
                @Override
                public void onMessage(String message) {
                    try {
                        JsonNode node = objectMapper.readTree(message);
                        if (node.has("code") && node.get("code").asInt() == 551) {
                            Earthquake earthquake = parseEarthquake(node);
                            notifyListeners(earthquake);
                        }
                    } catch (Exception e) {
                        logger.error("Failed to parse WebSocket message", e);
                    }
                }
                
                @Override
                public void onClose(int code, String reason, boolean remote) {
                    logger.info("WebSocket connection closed: {} - {}", code, reason);
                    
                    // Attempt to reconnect after a delay
                    if (remote) {
                        executorService.schedule(() -> {
                            logger.info("Attempting to reconnect WebSocket");
                            connectWebSocket();
                        }, 5, TimeUnit.SECONDS);
                    }
                }
                
                @Override
                public void onError(Exception ex) {
                    logger.error("WebSocket error", ex);
                }
            };
            
            webSocketClient.connect();
        } catch (URISyntaxException e) {
            logger.error("Invalid WebSocket URI", e);
        }
    }
    
    private Earthquake parseEarthquake(JsonNode node) {
        try {
            String id = node.get("id").asText();
            
            // Parse earthquake data
            JsonNode earthquakeNode = node.get("earthquake");
            String hypocenterName = earthquakeNode.get("hypocenter").get("name").asText();
            double latitude = earthquakeNode.get("hypocenter").get("latitude").asDouble();
            double longitude = earthquakeNode.get("hypocenter").get("longitude").asDouble();
            double magnitude = earthquakeNode.get("hypocenter").get("magnitude").asDouble();
            int depth = earthquakeNode.get("hypocenter").get("depth").asInt();
            
            // Parse time
            String timeStr = earthquakeNode.get("time").asText();
            LocalDateTime time = LocalDateTime.parse(timeStr, DATE_TIME_FORMATTER);
            
            // Parse intensity
            String maxIntensity = "Unknown";
            List<String> affectedAreas = new ArrayList<>();
            
            if (earthquakeNode.has("maxScale")) {
                int scaleCode = earthquakeNode.get("maxScale").asInt();
                maxIntensity = convertScaleToIntensity(scaleCode);
            }
            
            if (earthquakeNode.has("domesticTsunami")) {
                String tsunami = earthquakeNode.get("domesticTsunami").asText();
                if (!tsunami.equals("None")) {
                    maxIntensity += " (Tsunami: " + tsunami + ")";
                }
            }
            
            // Parse affected areas
            if (node.has("points")) {
                for (JsonNode pointNode : node.get("points")) {
                    String areaName = pointNode.get("addr").asText();
                    String scaleStr = convertScaleToIntensity(pointNode.get("scale").asInt());
                    affectedAreas.add(areaName + ": " + scaleStr);
                }
            }
            
            return new Earthquake(id, time, hypocenterName, latitude, longitude, 
                                 magnitude, depth, maxIntensity, affectedAreas);
        } catch (Exception e) {
            logger.error("Failed to parse earthquake data", e);
            throw new RuntimeException("Failed to parse earthquake data", e);
        }
    }
    
    private Earthquake parseJMAEarthquake(JsonNode node) {
        try {
            String id = node.get("id").asText();
            
            // Parse earthquake data
            String hypocenterName = node.get("earthquake").get("hypocenter").get("name").asText();
            double latitude = node.get("earthquake").get("hypocenter").get("latitude").asDouble();
            double longitude = node.get("earthquake").get("hypocenter").get("longitude").asDouble();
            double magnitude = node.get("earthquake").get("hypocenter").get("magnitude").asDouble();
            int depth = node.get("earthquake").get("hypocenter").get("depth").asInt();
            
            // Parse time
            String timeStr = node.get("earthquake").get("time").asText();
            LocalDateTime time = LocalDateTime.parse(timeStr, DATE_TIME_FORMATTER);
            
            // Parse intensity
            String maxIntensity = "Unknown";
            if (node.get("earthquake").has("maxScale")) {
                int scaleCode = node.get("earthquake").get("maxScale").asInt();
                maxIntensity = convertScaleToIntensity(scaleCode);
            }
            
            // Parse tsunami info
            if (node.get("earthquake").has("domesticTsunami")) {
                String tsunami = node.get("earthquake").get("domesticTsunami").asText();
                if (!tsunami.equals("None")) {
                    maxIntensity += " (Tsunami: " + tsunami + ")";
                }
            }
            
            // Parse affected areas
            List<String> affectedAreas = new ArrayList<>();
            if (node.has("points")) {
                for (JsonNode pointNode : node.get("points")) {
                    String areaName = pointNode.get("addr").asText();
                    String scaleStr = convertScaleToIntensity(pointNode.get("scale").asInt());
                    affectedAreas.add(areaName + ": " + scaleStr);
                }
            }
            
            return new Earthquake(id, time, hypocenterName, latitude, longitude, 
                                 magnitude, depth, maxIntensity, affectedAreas);
        } catch (Exception e) {
            logger.error("Failed to parse JMA earthquake data", e);
            throw new RuntimeException("Failed to parse JMA earthquake data", e);
        }
    }
    
    private String convertScaleToIntensity(int scale) {
        switch (scale) {
            case 10: return "1";
            case 20: return "2";
            case 30: return "3";
            case 40: return "4";
            case 45: return "5-";
            case 50: return "5+";
            case 55: return "6-";
            case 60: return "6+";
            case 70: return "7";
            default: return "Unknown";
        }
    }
    
    private void notifyListeners(Earthquake earthquake) {
        for (Consumer<Earthquake> listener : earthquakeListeners) {
            try {
                listener.accept(earthquake);
            } catch (Exception e) {
                logger.error("Error notifying earthquake listener", e);
            }
        }
    }
}