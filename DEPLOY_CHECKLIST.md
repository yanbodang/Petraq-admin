# 部署检查清单

## 部署前检查

- [ ] 确保所有代码已提交到 Git
- [ ] 检查 `package.json` 中的构建脚本是否正确
- [ ] 确认 `vite.config.ts` 中 `base: './'` 已设置
- [ ] 确认 `src/App.tsx` 中的 `basename` 配置正确
- [ ] 测试本地构建：`npm run build`
- [ ] 测试本地预览：`npm run preview`

## GitHub 仓库设置

- [ ] 仓库已创建在 GitHub
- [ ] 代码已推送到 `main` 或 `master` 分支
- [ ] GitHub Pages 已启用（Settings → Pages → Source: GitHub Actions）
- [ ] 如果仓库名不是 `petraq-admin`，已设置 `VITE_BASE_PATH` 环境变量

## 部署步骤

1. **提交所有更改**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **检查 GitHub Actions**
   - 进入仓库的 Actions 标签页
   - 查看 "Deploy to GitHub Pages" 工作流是否运行
   - 等待构建和部署完成

3. **验证部署**
   - 访问：`https://yourusername.github.io/petraq-admin/`
   - 检查所有页面是否正常加载
   - 测试路由导航

## 部署后验证

- [ ] 首页正常加载
- [ ] 所有路由页面可访问
- [ ] 静态资源（CSS、JS）正常加载
- [ ] 图表和组件正常显示
- [ ] 没有控制台错误

## 故障排除

如果遇到问题，查看：
1. GitHub Actions 日志
2. 浏览器控制台错误
3. 网络请求状态
4. `DEPLOY.md` 中的常见问题部分

