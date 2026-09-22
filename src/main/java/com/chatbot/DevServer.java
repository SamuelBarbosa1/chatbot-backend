package com.chatbot;

import com.chatbot.service.GeminiService;
import com.chatbot.util.FaqLoader;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Servidor de desenvolvimento independente para testar o backend Java 8 
 * sem precisar do Apache Tomcat rodando.
 */
public class DevServer {
    private static final int PORT = 8080;
    private static final Gson gson = new Gson();
    private static final GeminiService geminiService = new GeminiService();

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // 1. Endpoint /api/chat (POST)
        server.createContext("/api/chat", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                addCorsHeaders(exchange);

                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    exchange.sendResponseHeaders(200, -1);
                    return;
                }

                if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                    sendJson(exchange, 405, "{\"error\":\"Método não permitido. Use POST.\"}");
                    return;
                }

                try (BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
                    StringBuilder body = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        body.append(line);
                    }

                    String raw = body.toString().trim();
                    if (raw.isEmpty()) {
                        sendJson(exchange, 400, "{\"error\":\"Corpo da requisição vazio.\"}");
                        return;
                    }

                    JsonObject json = JsonParser.parseString(raw).getAsJsonObject();
                    String message = json.has("message") ? json.get("message").getAsString().trim() : "";

                    if (message.isEmpty()) {
                        sendJson(exchange, 400, "{\"error\":\"A mensagem do usuário é obrigatória.\"}");
                        return;
                    }

                    String reply = geminiService.generateReply(message);
                    JsonObject resp = new JsonObject();
                    resp.addProperty("reply", reply);
                    sendJson(exchange, 200, resp.toString());

                } catch (Exception e) {
                    System.err.println("Erro no DevServer: " + e.getMessage());
                    sendJson(exchange, 503, "{\"error\":\"Erro ao processar mensagem com Gemini.\"}");
                }
            }
        });

        // 2. Endpoint /api/faq/quick-questions (GET)
        server.createContext("/api/faq/quick-questions", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                addCorsHeaders(exchange);

                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    exchange.sendResponseHeaders(200, -1);
                    return;
                }

                List<String> questions = FaqLoader.getQuickQuestions(4);
                JsonObject resp = new JsonObject();
                resp.add("questions", gson.toJsonTree(questions));
                sendJson(exchange, 200, resp.toString());
            }
        });

        // 3. Página Web / (GET)
        server.createContext("/", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                String path = exchange.getRequestURI().getPath();
                if (!path.equals("/") && !path.equals("/index.html")) {
                    exchange.sendResponseHeaders(404, -1);
                    return;
                }

                addCorsHeaders(exchange);
                byte[] htmlBytes = loadIndexHtml();
                exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
                exchange.sendResponseHeaders(200, htmlBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(htmlBytes);
                }
            }
        });

        server.setExecutor(null);
        server.start();
        System.out.println("=================================================");
        System.out.println("🚀 DevServer Java 8 rodando em: http://localhost:" + PORT);
        System.out.println("=================================================");
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private static void sendJson(HttpExchange exchange, int statusCode, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static byte[] loadIndexHtml() {
        try {
            File file = new File("src/main/webapp/index.html");
            if (file.exists()) {
                byte[] bytes = new byte[(int) file.length()];
                try (FileInputStream fis = new FileInputStream(file)) {
                    fis.read(bytes);
                    return bytes;
                }
            }
        } catch (Exception ignored) {}
        return "<h1>Chatbot Java 8 Online</h1>".getBytes(StandardCharsets.UTF_8);
    }
}
