package com.chatbot.servlet;

import com.chatbot.util.FaqLoader;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet(name = "QuickQuestionsServlet", urlPatterns = {"/api/faq/quick-questions"})
public class QuickQuestionsServlet extends HttpServlet {

    private static final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json; charset=UTF-8");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();

        // Obtém até 4 perguntas destacadas para a tela de chat
        List<String> questions = FaqLoader.getQuickQuestions(4);

        JsonObject result = new JsonObject();
        result.add("questions", gson.toJsonTree(questions));

        out.print(result.toString());
    }
}
