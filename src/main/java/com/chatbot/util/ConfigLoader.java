package com.chatbot.util;

import java.io.InputStream;
import java.util.Properties;

public class ConfigLoader {
    private static final Properties properties = new Properties();

    static {
        try (InputStream input = ConfigLoader.class.getClassLoader().getResourceAsStream("application.properties")) {
            if (input != null) {
                properties.load(input);
            }
        } catch (Exception e) {
            System.err.println("Aviso: Não foi possível carregar application.properties: " + e.getMessage());
        }
    }

    public static String get(String key, String defaultValue) {
        // Permite sobrescrever por variável de ambiente (ex: GEMINI_API_KEY para gemini.api.key)
        String envKey = key.toUpperCase().replace('.', '_');
        String envValue = System.getenv(envKey);
        if (envValue != null && !envValue.trim().isEmpty()) {
            return envValue.trim();
        }

        String propValue = properties.getProperty(key);
        if (propValue != null && !propValue.trim().isEmpty()) {
            return propValue.trim();
        }

        return defaultValue;
    }

    public static String getApiKey() {
        return get("gemini.api.key", "");
    }
}
