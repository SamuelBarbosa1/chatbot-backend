package com.chatbot.util;

import com.chatbot.model.FaqItem;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class FaqLoader {
    private static final Gson gson = new Gson();

    private static List<FaqItem> cachedFaqList = null;
    private static String cachedSystemInstruction = null;

    public static synchronized List<FaqItem> loadFaqList() {
        if (cachedFaqList != null) {
            return cachedFaqList;
        }

        try (InputStream is = FaqLoader.class.getClassLoader().getResourceAsStream("faq.json")) {
            if (is == null) {
                System.err.println("Erro: faq.json não encontrado no classpath.");
                return new ArrayList<>();
            }
            Type listType = new TypeToken<List<FaqItem>>() {}.getType();
            cachedFaqList = gson.fromJson(new InputStreamReader(is, StandardCharsets.UTF_8), listType);
            return cachedFaqList;
        } catch (Exception e) {
            System.err.println("Erro ao ler faq.json: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public static List<String> getQuickQuestions(int maxCount) {
        List<FaqItem> faqList = loadFaqList();
        // Prioriza as perguntas marcadas com destaque: true
        List<String> featured = faqList.stream()
                .filter(FaqItem::isDestaque)
                .map(FaqItem::getPergunta)
                .limit(maxCount)
                .collect(Collectors.toList());

        if (!featured.isEmpty()) {
            return featured;
        }

        return faqList.stream()
                .map(FaqItem::getPergunta)
                .limit(maxCount)
                .collect(Collectors.toList());
    }

    public static synchronized String buildSystemInstruction() {
        if (cachedSystemInstruction != null) {
            return cachedSystemInstruction;
        }

        List<FaqItem> faqList = loadFaqList();
        StringBuilder context = new StringBuilder();

        for (FaqItem item : faqList) {
            context.append("- Categoria: ").append(item.getCategoria()).append("\n")
                   .append("  Pergunta: ").append(item.getPergunta()).append("\n")
                   .append("  Resposta: ").append(item.getResposta()).append("\n\n");
        }

        cachedSystemInstruction = "Você é o assistente virtual do nosso aplicativo. Sua função é tirar dúvidas de usuários com base EXCLUSIVAMENTE nas informações do FAQ fornecido abaixo.\n\n"
             + "Regras de comportamento:\n"
             + "1. Responda de forma cortês, objetiva, clara e concisa (ideal para telas de chat mobile).\n"
             + "2. Se a dúvida do usuário estiver relacionada ao FAQ, utilize as respostas cadastradas para explicar.\n"
             + "3. Se a pergunta NÃO for encontrada no FAQ ou for totalmente fora do contexto do sistema, responda educadamente dizendo que não possui essa informação e sugira que o usuário entre em contato com o suporte humano.\n"
             + "4. Nunca invente procedimentos que não estejam listados abaixo.\n"
             + "5. NUNCA use aspas simples (' ') ao mencionar botões, opções, abas ou telas. Em vez disso, utilize formatação em negrito (por exemplo: **Esqueci minha senha**, **Cancelar**, **Perfil**).\n\n"
             + "[BASE DE CONHECIMENTO DO SISTEMA / FAQ]\n"
             + context.toString();

        return cachedSystemInstruction;
    }
}
