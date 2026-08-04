@echo off
chcp 65001
:: 魔法俱乐部前端构建脚本

echo ========================================
echo   魔法俱乐部前端构建脚本
echo ========================================
echo.

:: 检查 node
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 npm 命令
    echo.
    echo 请确保已安装 Node.js
echo.
    pause
    exit /b 1
)

echo [1/3] 安装依赖...
call npm install
if %errorlevel% neq 0 (
    echo [错误] 安装依赖失败
    pause
    exit /b 1
)
echo √ 依赖安装完成
echo.

echo [2/3] 构建生产环境代码...
call npm run build
if %errorlevel% neq 0 (
    echo [错误] 构建失败
    pause
    exit /b 1
)
echo √ 构建完成
echo.

echo [3/3] 复制到 deploy 目录...
if not exist "..\..\Desktop\deploy" mkdir "..\..\Desktop\deploy"
xcopy /E /I /Y "dist\*" "..\..\Desktop\deploy\dist\"
echo √ 复制完成
echo.

echo ========================================
echo   构建成功！
echo ========================================
echo.
echo 构建文件位置：
echo   dist\
echo   ..\..\Desktop\deploy\dist\
echo.
pause
