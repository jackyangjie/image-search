# Expo Go 手机预览指南

## 📱 准备工作

### 1. 在手机上安装 Expo Go App

**iOS 用户：**
1. 打开 App Store
2. 搜索 "Expo Go"
3. 下载安装（免费）

**Android 用户：**
1. 打开 Google Play
2. 搜索 "Expo Go"
3. 下载安装（免费）

---

### 2. 确保手机和电脑在同一网络

**重要：** 手机和电脑必须连接到同一个 WiFi 网络

**检查方法：**
- 查看手机和电脑的 IP 地址
- 确保它们在同一网段（如都是 192.168.1.x）

---

## 🚀 启动 Expo 开发服务器

### 方式一：直接启动（推荐）

```bash
cd /home/yangjie/learn/image-search

# 清除缓存并启动
npx expo start -c
```

### 方式二：如果依赖有问题

```bash
cd /home/yangjie/learn/image-search

# 先安装依赖
npm install --legacy-peer-deps

# 启动
cd node_modules/expo
node bin/cli start
```

### 方式三：使用 npx 直接运行

```bash
cd /home/yangjie/learn/image-search

# 使用 --tunnel 参数（如果局域网不行）
npx expo start --tunnel
```

---

## 📲 连接手机

### 步骤 1：查看二维码

启动成功后，终端会显示：

```
🚀  SmartPhoto Search
📱  Scan the QR code with Expo Go

    [二维码图片]

⬇️  Press 'a' for Android
⬇️  Press 'i' for iOS simulator
⬇️  Press 'w' for Web

📦  Bundle loaded from: http://192.168.x.x:8081
```

### 步骤 2：扫描二维码

**iOS：**
1. 打开 Expo Go App
2. 点击 "Scan QR Code"
3. 对准终端显示的二维码
4. 等待加载完成

**Android：**
1. 打开 Expo Go App
2. 点击底部 "Projects" 标签
3. 点击 "Scan QR code" 或 "+"
4. 扫描二维码

---

## 🔧 常见问题解决

### 问题 1：扫描后显示 "No projects found"

**解决：**
```bash
# 尝试使用 tunnel 模式
npx expo start --tunnel
```

### 问题 2：网络连接失败

**检查：**
1. 确保手机和电脑在同一 WiFi
2. 关闭电脑防火墙（临时）
3. 尝试重启路由器

**解决：**
```bash
# 指定 IP 地址启动
npx expo start --host 192.168.x.x
```

### 问题 3：二维码无法扫描

**替代方法：**
1. 在终端中查看 URL：`http://192.168.x.x:8081`
2. 手动在 Expo Go 中输入 URL
3. 点击 "Enter URL manually"

### 问题 4：Bundle 加载失败

**解决：**
```bash
# 清除缓存
npx expo start -c

# 或
rm -rf node_modules/.cache
npx expo start
```

### 问题 5：依赖安装失败

**解决：**
```bash
# 清除并重新安装
rm -rf node_modules
npm cache clean --force
npm install --legacy-peer-deps
```

---

## 📋 完整操作流程

### 第一次运行

```bash
# 1. 进入项目目录
cd /home/yangjie/learn/image-search

# 2. 安装依赖（如果还没安装）
npm install --legacy-peer-deps

# 3. 启动 Expo 开发服务器
npx expo start

# 4. 在手机上打开 Expo Go App
# 5. 扫描终端显示的二维码
# 6. 等待应用加载完成（约 30-60 秒）
```

### 日常开发

```bash
# 只需一步
cd /home/yangjie/learn/image-search
npx expo start
```

---

## 🎯 开发技巧

### 实时预览

- 修改代码 → 手机自动刷新
- 支持热重载（Hot Reload）
- Shake 手机打开开发者菜单

### 开发者菜单功能

摇一摇手机调出：
- **Reload** - 重新加载
- **Debug Remote JS** - 远程调试
- **Show Performance Monitor** - 性能监控
- **Toggle Element Inspector** - 元素检查器

### 快捷键

在终端中：
- `r` - 重新加载
- `m` - 打开开发者菜单
- `ctrl + c` - 停止服务器

---

## 🌐 离线运行（可选）

如果不想依赖网络：

```bash
# 导出静态文件
npx expo export:web

# 或构建独立应用
npx expo prebuild
cd ios && xcodebuild -scheme SmartPhotoSearch
```

---

## 📞 故障排除

### 查看调试信息

```bash
# 查看详细日志
npx expo start --debug

# 或
EXPO_DEBUG=1 npx expo start
```

### 检查网络连接

```bash
# 查看本机 IP
ifconfig | grep "inet " | head -1

# 确保端口开放
lsof -i :8081
```

### 重置 Expo

```bash
# 清除所有缓存
npx expo login  # 如果需要登录
npx expo logout
npx expo whoami

# 重置项目
npx expo start --reset-cache
```

---

## ✅ 成功标志

当您在手机上看到以下界面时，说明成功了：

1. **启动页** - 显示应用图标和名称
2. **权限页** - "访问您的照片" 引导页面
3. **主界面** - 底部有 🔍搜索 和 🖼️相册 标签

---

## 🎉 下一步

成功运行后，您可以：
1. 在手机上测试所有功能
2. 截图分享给团队
3. 继续开发新功能
4. 构建发布版本

**遇到问题？** 请检查终端输出的错误信息，或参考上面的常见问题解决。
