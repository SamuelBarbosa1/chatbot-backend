package com.chatbot.model;

public class FaqItem {
    private String categoria;
    private String pergunta;
    private String resposta;
    private boolean destaque;

    public FaqItem() {}

    public FaqItem(String categoria, String pergunta, String resposta, boolean destaque) {
        this.categoria = categoria;
        this.pergunta = pergunta;
        this.resposta = resposta;
        this.destaque = destaque;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getPergunta() {
        return pergunta;
    }

    public void setPergunta(String pergunta) {
        this.pergunta = pergunta;
    }

    public String getResposta() {
        return resposta;
    }

    public void setResposta(String resposta) {
        this.resposta = resposta;
    }

    public boolean isDestaque() {
        return destaque;
    }

    public void setDestaque(boolean destaque) {
        this.destaque = destaque;
    }
}
