/**
 * ==========================================
 * 汕牛港火锅 — 抖音素材一键提取脚本
 * ==========================================
 *
 * 使用方法：
 * 1. 在浏览器打开你家火锅店的抖音主页
 *    （就是 https://v.douyin.com/EcBv8ALs3dI/ 这个链接）
 * 2. 按 F12 打开开发者工具，点击 "Console" / "控制台" 标签
 * 3. 把整个脚本粘贴进去，按 Enter 运行
 * 4. 运行完后，浏览器会自动下载一个 douyin_data.json 文件
 * 5. 把这个文件放到 d:\网站\ 目录下
 * 6. 把截图/下载的图片放到 d:\网站\sucaiku\ 目录下
 */

(async function extractDouyinData() {
  console.log('🔥 开始提取汕牛港火锅抖音数据...');

  const result = {
    extracted_at: new Date().toISOString(),
    restaurant_name: '汕牛港潮汕鲜牛肉火锅',
    profile: {},
    videos: [],
    photos: []
  };

  // ========== 1. 从页面 DOM 提取 ==========

  // 尝试多种方式获取用户信息
  const selectors = {
    nickname: [
      '[data-e2e="user-title"]',
      '[class*="nickname"]',
      '[class*="user-name"]',
      '[class*="profile-name"]',
      'h1',
      '[class*="title"]'
    ],
    bio: [
      '[data-e2e="user-desc"]',
      '[class*="bio"]',
      '[class*="desc"]',
      '[class*="signature"]',
      '[class*="intro"]'
    ],
    avatar: [
      '[data-e2e="user-avatar"] img',
      '[class*="avatar"] img',
      'img[class*="avatar"]'
    ],
    follower_count: [
      '[data-e2e="follower-count"]',
      '[class*="follower"]',
      '[class*="follow-count"]'
    ]
  };

  for (const [key, sels] of Object.entries(selectors)) {
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (el) {
        if (key === 'avatar') {
          result.profile[key] = el.src || el.getAttribute('data-src') || '';
        } else {
          result.profile[key] = el.textContent.trim();
        }
        console.log(`  ✅ 找到 ${key}: ${result.profile[key].substring(0, 50)}`);
        break;
      }
    }
  }

  // ========== 2. 从页面上的视频列表提取 ==========

  // 尝试获取视频卡片
  const videoCards = document.querySelectorAll([
    '[data-e2e="user-post-item"]',
    '[class*="video-card"]',
    '[class*="post-item"]',
    '[class*="waterfall"] > div',
    'ul[class*="list"] > li',
    '[class*="video"] a[href*="video"]'
  ].join(','));

  console.log(`  📹 找到 ${videoCards.length} 个视频卡片节点`);

  videoCards.forEach((card, i) => {
    // 尝试提取封面图
    const img = card.querySelector('img');
    const coverUrl = img ? (img.src || img.getAttribute('data-src') || img.getAttribute('srcset') || '') : '';

    // 尝试提取标题
    const titleEl = card.querySelector('[class*="title"], [class*="desc"], [class*="text"]');
    const title = titleEl ? titleEl.textContent.trim() : '';

    // 尝试提取播放量
    const statsEl = card.querySelector('[class*="stat"], [class*="count"], [class*="play"]');
    const stats = statsEl ? statsEl.textContent.trim() : '';

    // 尝试提取视频链接
    const link = card.querySelector('a[href*="video"]') || card.closest('a');
    const videoUrl = link ? link.href : '';

    if (coverUrl || title) {
      result.videos.push({ index: i + 1, coverUrl, title, stats, videoUrl });
    }
  });

  // ========== 3. 尝试从 __NUXT__ / __NEXT_DATA__ / window 全局变量提取 ==========

  // SSR 数据（Nuxt/Next.js 常见）
  const ssrDataKeys = ['__NUXT__', '__NEXT_DATA__', '__INITIAL_STATE__', 'SSR_DATA', '__DOUYIN_DATA__'];
  for (const key of ssrDataKeys) {
    try {
      if (window[key]) {
        result._ssr_data_key = key;
        result._ssr_data = JSON.parse(JSON.stringify(window[key])).slice
          ? JSON.parse(JSON.stringify(window[key])).slice(0, 500)
          : '[Object - too large]';
        console.log(`  ✅ 找到 SSR 数据: window.${key}`);
        break;
      }
    } catch(e) {}
  }

  // 尝试从 all script tags 中提取 JSON-LD 或内联数据
  document.querySelectorAll('script').forEach(script => {
    const content = script.textContent || script.innerText || '';
    // JSON-LD
    if (script.type === 'application/ld+json') {
      try {
        result._jsonld = JSON.parse(content);
        console.log('  ✅ 找到 JSON-LD 数据');
      } catch(e) {}
    }
    // 内联 window.__ 数据
    const matches = content.match(/window\.__(\w+)__\s*=\s*({.+?});/gs);
    if (matches) {
      result._inline_data_keys = result._inline_data_keys || [];
      matches.forEach(m => {
        const keyMatch = m.match(/window\.__(\w+)__/);
        if (keyMatch) result._inline_data_keys.push(keyMatch[1]);
      });
    }
  });

  // ========== 4. 尝试直接从页面截取所有可见图片 URL ==========
  const allImages = document.querySelectorAll('img[src*="douyinpic.com"], img[src*="pstatp.com"], img[src*="douyinvod.com"], img[src*="snssdk.com"]');
  allImages.forEach((img, i) => {
    const url = img.src || img.getAttribute('data-src') || '';
    if (url && !result.photos.find(p => p.url === url)) {
      result.photos.push({ index: i + 1, url, alt: img.alt || '' });
    }
  });
  console.log(`  🖼️  找到 ${result.photos.length} 张抖音 CDN 图片`);

  // ========== 5. 导出 ==========
  console.log('\n📊 提取结果摘要:');
  console.log(`  头像: ${result.profile.avatar ? '✅' : '❌'}`);
  console.log(`  昵称: ${result.profile.nickname ? '✅' : '❌'}`);
  console.log(`  简介: ${result.profile.bio ? '✅' : '❌'}`);
  console.log(`  视频数: ${result.videos.length}`);
  console.log(`  图片数: ${result.photos.length}`);
  console.log(`  SSR数据: ${result._ssr_data_key ? '✅ ' + result._ssr_data_key : '❌'}`);

  // 触发下载
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'douyin_data.json';
  a.click();
  URL.revokeObjectURL(url);

  console.log('\n💾 JSON 文件已自动下载！放到 d:\\网站\\ 目录下');
  console.log('\n📸 接下来请手动操作:');
  console.log('  1. 在抖音主页截图保存为 sucaiku/hero-bg.jpg（门头或牛肉大图）');
  console.log('  2. 滚动浏览所有视频，逐个截图保存到 sucaiku/');
  console.log('  3. 右键视频封面 → 另存为，保存高清图');

  return result;
})();
