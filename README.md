# 汕牛港潮汕鲜牛肉火锅 — 官方网站

## 🚀 快速上线

1. 把整个文件夹上传到任意静态服务器即可：
   - **免费方案**：GitHub Pages / Netlify / Vercel
   - **国内方案**：阿里云 OSS / 腾讯云 COS / 又拍云

2. 没有服务器？直接在浏览器打开 `index.html` 也能预览！

## 📝 需要替换的内容

### 必改项
| 文件 | 位置 | 内容 |
|------|------|------|
| `index.html` | 百度地图 script 标签 | 把 `YOUR_BAIDU_MAP_AK` 换成你的百度地图 API Key（免费申请：https://lbsyun.baidu.com/） |
| `index.html` | 所有 `tel:13186583336` | 改成店里真实电话 |
| `index.html` | 菜单价格 | 按实际菜单调整 |
| `index.html` | 营业时间 | 确认实际营业时间 |

### 图片素材
所有图片放到 `sucaiku/` 文件夹，支持的命名：

```
sucaiku/
├── hero-bg.jpg          # 首屏背景大图（建议 1200×800 以上）
├── store-front.jpg      # 门店门头
├── store-interior.jpg   # 店内环境
├── beef-platter.jpg     # 牛肉拼盘
├── beef-cut.jpg         # 现切牛肉特写
├── beef-balls.jpg       # 手打牛丸
├── hotpot-boiling.jpg   # 沸腾火锅
├── dipping-sauce.jpg    # 蘸料台
├── group-dining.jpg     # 多人聚餐
├── beef-detail.jpg      # 牛肉部位细节
└── qr-wechat.png        # 微信客服二维码
```

图片放进去后刷新页面即可自动显示，不需要改代码。

### 抖音素材提取

1. 浏览器打开火锅店的抖音主页
2. 按 F12 → Console（控制台）
3. 粘贴 `extract_douyin.js` 全部内容 → Enter 运行
4. 自动下载 `douyin_data.json`
5. 手动保存需要的图片到 `sucaiku/`

## 🎨 技术说明

- 纯静态 HTML/CSS/JS，零框架零依赖
- 移动优先响应式（手机/平板/桌面全适配）
- 百度地图 JS API（需申请免费 AK）
- 系统默认字体，无需加载外部字体

## 📞 联系信息（当前占位，请修改）

- 电话：待确认
- 地址：张家港市塘桥镇北京路 222-224-226 号
- 营业时间：待确认
