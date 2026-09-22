package com.chatbot.service;

import com.chatbot.util.ConfigLoader;
import com.chatbot.util.FaqLoader;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import okhttp3.*;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class GeminiService {
    private static final MediaType JSON_MEDIA_TYPE = MediaType.parse("application/json; charset=utf-8");
    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

    // Cliente HTTP compartilhado com pool de conexões HTTP/2 para máxima performance
    private static final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .connectionPool(new ConnectionPool(5, 5, TimeUnit.MINUTES))
            .build();

    private final List<String> modelsToTry;
    private final double temperature;

    public GeminiService() {
        String configuredModels = ConfigLoader.get("gemini.models", "gemini-3.6-flash,gemini-flash-latest");
        this.modelsToTry = Arrays.asList(configuredModels.split(","));
        
        double temp = 0.3;
        try {
            temp = Double.parseDouble(ConfigLoader.get("gemini.temperature", "0.3"));
        } catch (NumberFormatException ignored) {}
        this.temperature = temp;
    }

    public String generateReply(String userMessage) throws IOException {
        String apiKey = ConfigLoader.getApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("GEMINI_API_KEY não foi configurada no application.properties ou nas variáveis de ambiente.");
        }

        String systemInstruction = FaqLoader.buildSystemInstruction();
        String jsonPayload = buildRequestJson(userMessage, systemInstruction, this.temperature);

        IOException lastException = null;

        for (String rawModel : modelsToTry) {
            String model = rawModel.trim();
            if (model.isEmpty()) continue;

            String endpointUrl = BASE_URL + model + ":generateContent?key=" + apiKey;

            for (int attempt = 1; attempt <= 2; attempt++) {
                RequestBody body = RequestBody.create(jsonPayload, JSON_MEDIA_TYPE);
                Request request = new Request.Builder()
                        .url(endpointUrl)
                        .post(body)
                        .build();

                try (Response response = httpClient.newCall(request).execute()) {
                    int statusCode = response.code();
                    String responseBody = response.body() != null ? response.body().string() : "";

                    if (response.isSuccessful() && !responseBody.isEmpty()) {
                        String text = extractTextFromResponse(responseBody);
                        if (text != null && !text.trim().isEmpty()) {
                            return text.trim();
                        }
                    }

                    System.err.println("Aviso: Modelo '" + model + "' retornou status " + statusCode);

                    // Se for 503 (alta demanda) ou 429 (rate limit), tenta novamente brevemente
                    if (statusCode == 503 || statusCode == 429) {
                        try {
                            Thread.sleep(400);
                        } catch (InterruptedException ignored) {}
                    } else {
                        break; // 404 ou erro definitivo, vai para o próximo modelo
                    }
                } catch (IOException e) {
                    lastException = e;
                    System.err.println("Erro de conexão ao chamar modelo '" + model + "': " + e.getMessage());
                }
            }
        }

        throw lastException != null ? lastException : new IOException("Nenhum modelo do Gemini respondeu com sucesso.");
    }

    private String buildRequestJson(String userMessage, String systemInstruction, double temp) {
        JsonObject root = new JsonObject();

        // 1. system_instruction
        JsonObject sysInstruction = new JsonObject();
        JsonArray sysParts = new JsonArray();
        JsonObject sysPartText = new JsonObject();
        sysPartText.addProperty("text", systemInstruction);
        sysParts.add(sysPartText);
        sysInstruction.add("parts", sysParts);
        root.add("system_instruction", sysInstruction);

        // 2. contents
        JsonArray contents = new JsonArray();
        JsonObject contentItem = new JsonObject();
        JsonArray contentParts = new JsonArray();
        JsonObject userPartText = new JsonObject();
        userPartText.addProperty("text", userMessage);
        contentParts.add(userPartText);
        contentItem.add("parts", contentParts);
        contents.add(contentItem);
        root.add("contents", contents);

        // 3. generationConfig
        JsonObject genConfig = new JsonObject();
        genConfig.addProperty("temperature", temp);
        root.add("generationConfig", genConfig);

        return root.toString();
    }

    private String extractTextFromResponse(String responseJson) {
        try {
            JsonObject root = JsonParser.parseString(responseJson).getAsJsonObject();
            if (root.has("candidates")) {
                JsonArray candidates = root.getAsJsonArray("candidates");
                if (candidates.size() > 0) {
                    JsonObject firstCandidate = candidates.get(0).getAsJsonObject();
                    if (firstCandidate.has("content")) {
                        JsonObject content = firstCandidate.getAsJsonObject("content");
                        if (content.has("parts")) {
                            JsonArray parts = content.getAsJsonArray("parts");
                            if (parts.size() > 0) {
                                return parts.get(0).getAsJsonObject().get("text").getAsString();
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Erro ao interpretar JSON da resposta do Gemini: " + e.getMessage());
        }
        return null;
    }
}
