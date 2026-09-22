@echo off
chcp 65001 > nul
echo ========================================================
echo   Compilando Chatbot Backend Java 8 para Tomcat 9
echo ========================================================

set "TOMCAT_LIB=C:\Program Files (x86)\Apache Software Foundation\Tomcat 9.0\lib\servlet-api.jar"
if not exist "%TOMCAT_LIB%" (
    set "TOMCAT_LIB=C:\Program Files\Apache Software Foundation\Tomcat 9.0\lib\servlet-api.jar"
)

set "CLASSPATH=lib\*;%TOMCAT_LIB%"
set "TARGET_DIR=target\build-temp"
set "WAR_TARGET=target\chatbot.war"

echo [1/5] Limpando pasta target...
if exist "target" rmdir /s /q "target"
mkdir "%TARGET_DIR%\WEB-INF\classes" 2>nul
mkdir "%TARGET_DIR%\WEB-INF\lib" 2>nul

echo [2/5] Compilando arquivos Java (Java 8)...
dir /s /b src\main\java\*.java > target\sources.txt
javac -cp "%CLASSPATH%" -d "%TARGET_DIR%\WEB-INF\classes" -source 1.8 -target 1.8 @target\sources.txt
if %errorlevel% neq 0 (
    echo [ERRO] Falha na compilação do Java!
    pause
    exit /b %errorlevel%
)

echo [3/5] Copiando recursos e bibliotecas...
xcopy /s /y /q "src\main\resources\*" "%TARGET_DIR%\WEB-INF\classes\" >nul
xcopy /s /y /q "lib\*" "%TARGET_DIR%\WEB-INF\lib\" >nul
xcopy /s /y /q "src\main\webapp\*" "%TARGET_DIR%\" >nul

echo [4/5] Gerando arquivo WAR...
cd "%TARGET_DIR%"
jar -cvf "..\chatbot.war" * >nul
cd ..\..

echo [5/5] SUCESSO! Arquivo gerado em: target\chatbot.war
echo ========================================================
echo Para implantar no Tomcat:
echo Copie o arquivo 'target\chatbot.war' para a pasta 'webapps' do seu Tomcat 9.
echo ========================================================
