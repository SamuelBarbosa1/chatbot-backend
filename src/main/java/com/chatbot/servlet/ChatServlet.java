package com.chatbot.servlet;

import com.chatbot.service.GeminiService;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;

@WebServlet(name = "ChatServlet", urlPatterns = {"/api/chat"})
public class ChatServlet extends HttpServlet {

    private GeminiService geminiService;

    @Override
    public void init() throws ServletException {
        super.init();
        this.geminiService = new GeminiService();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json; charset=UTF-8");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();

        // 1. Lê o corpo da requisição JSON
        StringBuilder jsonBuffer = new StringBuilder();
        String line;
        try (BufferedReader reader = request.getReader()) {
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }
        }

        String rawJson = jsonBuffer.toString().trim();
        if (rawJson.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject error = new JsonObject();
            error.addProperty("error", "Corpo da requisição JSON está vazio.");
            out.print(error.toString());
            return;
        }

        // 2. Extrai a propriedade 'message'
        String userMessage = "";
        try {
            JsonObject reqObj = JsonParser.parseString(rawJson).getAsJsonObject();
            if (reqObj.has("message") && !reqObj.get("message").isJsonNull()) {
                userMessage = reqObj.get("message").getAsString().trim();
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject error = new JsonObject();
            error.addProperty("error", "Formato de JSON inválido.");
            out.print(error.toString());
            return;
        }

        if (userMessage.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            JsonObject error = new JsonObject();
            error.addProperty("error", "A mensagem do usuário é obrigatória.");
            out.print(error.toString());
            return;
        }

        // 3. Chama o GeminiService e retorna a resposta
        try {
            String reply = geminiService.generateReply(userMessage);

            JsonObject success = new JsonObject();
            success.addProperty("reply", reply);
            out.print(success.toString());

        } catch (Exception e) {
            System.err.println("Erro ao processar mensagem com Gemini: " + e.getMessage());
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            JsonObject error = new JsonObject();
            error.addProperty("error", "O assistente está com alta demanda nos servidores no momento. Por favor, tente novamente em instantes.");
            out.print(error.toString());
        }
    }
}
