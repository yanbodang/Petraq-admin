# 部署指南

## GitHub Pages 部署

### 前置要求

1. GitHub 账户
2. 已创建 GitHub 仓库

### 快速部署步骤

#### 1. 初始化 Git 仓库（如果还没有）

```bash
cd petraq-admin
git init
git add .
git commit -m "Initial commit"
```

#### 2. 连接到 GitHub 仓库

```bash
# 替换为你的实际仓库地址
git remote add origin https://github.com/yourusername/petraq-admin.git
git branch -M main
git push -u origin main
```

#### 3. 启用 GitHub Pages

1. 进入 GitHub 仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单找到 **Pages**
4. 在 **Source** 部分，选择 **GitHub Actions**
5. 保存设置

#### 4. 配置仓库路径（如果仓库名不是 petraq-admin）

如果你的仓库名称不是 `petraq-admin`，需要：

1. 进入仓库 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. 添加：
   - Name: `VITE_BASE_PATH`
   - Value: `/your-repo-name`（你的仓库名称，必须以 `/` 开头）

或者直接修改 `src/App.tsx` 中的 basename：

```typescript
const basename = import.meta.env.MODE === 'development' 
  ? '/' 
  : '/your-repo-name';  // 改为你的仓库名称
```

#### 5. 触发部署

- **自动部署**：推送代码到 `main` 或 `master` 分支会自动触发
- **手动触发**：在仓库的 **Actions** 标签页，选择 "Deploy to GitHub Pages" 工作流，点击 "Run workflow"

#### 6. 查看部署状态

1. 进入仓库的 **Actions** 标签页
2. 查看最新的工作流运行状态
3. 部署成功后，访问：`https://yourusername.github.io/petraq-admin/`

### 部署后验证

部署成功后，访问你的 GitHub Pages URL，应该能看到应用正常运行。

如果遇到路由问题（404），检查：
1. `src/App.tsx` 中的 `basename` 是否正确
2. GitHub Pages 设置中 Source 是否选择了 "GitHub Actions"
3. 工作流是否成功完成

### 常见问题

#### 问题：页面显示 404

**解决方案**：
- 检查 `basename` 配置是否与仓库名称匹配
- 确保 GitHub Pages Source 设置为 "GitHub Actions"
- 检查 `vite.config.ts` 中的 `base` 配置为 `'./'`

#### 问题：资源文件加载失败

**解决方案**：
- 确保 `vite.config.ts` 中 `base: './'` 已设置
- 检查构建产物中的路径是否正确

#### 问题：工作流失败

**解决方案**：
- 检查 Actions 标签页中的错误信息
- 确保 `package.json` 中的构建脚本正确
- 检查 Node.js 版本是否兼容

### 更新部署

每次推送代码到 `main` 分支时，GitHub Actions 会自动：
1. 安装依赖
2. 构建项目
3. 部署到 GitHub Pages

无需手动操作。

### 回滚部署

如果需要回滚到之前的版本：
1. 在仓库的 **Actions** 标签页找到之前成功的部署
2. 点击进入详情
3. 可以查看该版本的构建产物

或者：
1. 使用 Git 回退到之前的提交
2. 推送代码触发新的部署

## 其他部署方式

### Vercel 部署

1. 访问 [Vercel](https://vercel.com)
2. 导入 GitHub 仓库
3. 自动检测并部署

### Netlify 部署

1. 访问 [Netlify](https://netlify.com)
2. 连接 GitHub 仓库
3. 构建命令：`npm run build`
4. 发布目录：`dist`

### 自定义服务器部署

```bash
# 构建项目
npm run build

# 将 dist 目录的内容上传到服务器
# 配置 Web 服务器（Nginx/Apache）指向 dist 目录
```

