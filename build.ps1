# Script de Compilação e Empacotamento do Chatbot para Apache Tomcat 9 (Java 8)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Compilando Chatbot Backend Java 8 para Tomcat 9" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$tomcatLib = "C:\Program Files (x86)\Apache Software Foundation\Tomcat 9.0\lib\servlet-api.jar"
if (-not (Test-Path $tomcatLib)) {
    $tomcatLib = "C:\Program Files\Apache Software Foundation\Tomcat 9.0\lib\servlet-api.jar"
}

$classpath = "lib/*;$tomcatLib"
$targetDir = "target/chatbot"
$warTarget = "target/chatbot.war"

# 1. Limpa e cria pastas de build
Write-Host "[1/4] Preparando diretórios de build..." -ForegroundColor Yellow
Remove-Item -Recurse -Force target -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path "$targetDir/WEB-INF/classes" | Out-Null
New-Item -ItemType Directory -Force -Path "$targetDir/WEB-INF/lib" | Out-Null

# 2. Compila os arquivos Java
Write-Host "[2/4] Compilando arquivos Java (Java 8)..." -ForegroundColor Yellow
$javaFiles = (Get-ChildItem -Recurse src/main/java -Filter "*.java").FullName
javac -cp $classpath -d "$targetDir/WEB-INF/classes" -source 1.8 -target 1.8 $javaFiles

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha na compilação do Java!" -ForegroundColor Red
    exit 1
}

# 3. Copia recursos, bibliotecas e webapp
Write-Host "[3/4] Copiando recursos e dependências..." -ForegroundColor Yellow
Copy-Item "src/main/resources/*" "$targetDir/WEB-INF/classes/" -Recurse -Force
Copy-Item "lib/*" "$targetDir/WEB-INF/lib/" -Force
Copy-Item "src/main/webapp/*" "$targetDir/" -Recurse -Force

# 4. Gera o arquivo chatbot.war
Write-Host "[4/4] Empacotando chatbot.war..." -ForegroundColor Yellow
Push-Location $targetDir
jar -cvf "../chatbot.war" * | Out-Null
Pop-Location

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " SUCESSO! Pasta e WAR gerados em target/:" -ForegroundColor Green
Write-Host " 👉 target/chatbot/ (Pasta descompactada para o Tomcat)" -ForegroundColor White
Write-Host " 👉 target/chatbot.war (Arquivo WAR)" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Como implantar no Tomcat 9:" -ForegroundColor Cyan
Write-Host "Copie a pasta 'target/chatbot' para dentro de:"
Write-Host "C:\Program Files (x86)\Apache Software Foundation\Tomcat 9.0\webapps\"
Write-Host "==========================================================" -ForegroundColor Cyan
