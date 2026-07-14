/**
 * ==========================================
 * 汕牛港火锅 — 抖音素材深度提取脚本 v2.0
 * ==========================================
 *
 * 使用方法：
 * 1. 浏览器打开你家火锅店的抖音主页：
 *    https://v.douyin.com/8cD-8Dacl0A/
 * 2. 等页面完全加载（看到视频列表出现）
 * 3. 按 F12 → Console（控制台）标签
 * 4. 把整个脚本粘贴进去 → Enter 运行
 * 5. 自动下载 douyin_data.json + 弹窗批量下载封面图
 *
 * 小技巧：运行前先多往下滚几屏，加载更多视频，能提取到更多内容
 */

(async function deepExtract() {
  console.clear();
  console.log('🔥🔥🔥 汕牛港抖音数据深度提取 v2.0 🔥🔥🔥');
  console.log('==========================================\n');

  const result = {
    extracted_at: new Date().toISOString(),
    source_url: location.href,
    profile: {},
    videos: [],
    images: [],
    raw_data_hints: []
  };

  // ==========================================
  // 1. 穷举法挖 window 全局数据
  // ==========================================
  console.log('🔍 [1/6] 扫描 window 全局变量...');

  const knownKeys = [
    '__NUXT__', '__NEXT_DATA__', '__INITIAL_STATE__',
    '__DOUYIN_DATA__', '__PRELOADED_STATE__', '__SSR_DATA__',
    'self.__next_f', '__MIDDLEWARE_DATA__',
    '__nuxt', '__app__', '__STORE__',
    'pageData', 'serverData', '_ssrData'
  ];

  for (const key of knownKeys) {
    try {
      const val = window[key];
      if (val !== undefined && val !== null) {
        const str = JSON.stringify(val);
        result.raw_data_hints.push({ key, size: str.length, preview: str.slice(0, 300) });

        // 深度搜索里面的图片 URL
        const imgUrls = str.match(/https?:\/\/[^"'\s]*?(?:douyinpic\.com|pstatp\.com|douyinvod\.com|snssdk\.com|byteimg\.com|ixigua\.com)[^"'\s,]*/gi) || [];
        imgUrls.forEach(url => {
          if (!result.images.find(i => i.url === url)) {
            result.images.push({ url, source: `window.${key}` });
          }
        });
      }
    } catch(e) {}
  }

  // 遍历 window 下所有属性找数据（限制前 200 个防卡死）
  let scanned = 0;
  for (const key of Object.keys(window).filter(k => k.startsWith('__') || /^(data|state|store|app|page|ssr)/i.test(k))) {
    if (scanned++ > 200) break;
    if (knownKeys.includes(key)) continue;
    try {
      const val = window[key];
      if (val && typeof val === 'object' && !(val instanceof HTMLElement)) {
        const str = JSON.stringify(val);
        if (str.length > 200 && str.length < 500000) {
          result.raw_data_hints.push({ key, size: str.length });
          const imgUrls = str.match(/https?:\/\/[^"'\s]*?(?:douyinpic\.com|pstatp\.com|douyinvod\.com|snssdk\.com|byteimg\.com)[^"'\s,]*/gi) || [];
          imgUrls.forEach(url => {
            if (!result.images.find(i => i.url === url)) {
              result.images.push({ url, source: `window.${key}` });
            }
          });
        }
      }
    } catch(e) {}
  }
  console.log(`  ✅ 扫描完成，发现 ${result.raw_data_hints.length} 个数据源，${result.images.length} 张 CDN 图片`);

  // ==========================================
  // 2. 从 DOM 提取用户信息
  // ==========================================
  console.log('\n🔍 [2/6] 提取用户资料...');

  result.profile.nickname = (() => {
    for (const sel of ['[data-e2e="user-title"]', 'h1[class*="name"]', '[class*="nickname"]', '[class*="user-name"]', '[class*="profile-name"]', 'h1']) {
      const el = document.querySelector(sel);
      if (el) return el.textContent.trim();
    }
    return document.title?.replace(/\s*[|—\-–·].*$/, '').trim() || '';
  })();

  result.profile.bio = (() => {
    for (const sel of ['[data-e2e="user-desc"]', '[class*="signature"]', '[class*="bio"]', '[class*="intro"]', '[class*="desc"]']) {
      const el = document.querySelector(sel);
      if (el) return el.textContent.trim();
    }
    return '';
  })();

  result.profile.avatar = (() => {
    for (const sel of ['[data-e2e="user-avatar"] img', '[class*="avatar"] img', 'img[src*="douyinpic.com"]']) {
      const el = document.querySelector(sel);
      if (el) return el.src || el.getAttribute('data-src') || '';
    }
    return result.images.find(i => i.url.includes('avatar'))?.url || '';
  })();

  // 粉丝/获赞等数字
  const statEls = document.querySelectorAll('[data-e2e="user-info"] span, [class*="count"], [class*="stat-num"], [class*="number"]');
  result.profile.stats_text = Array.from(statEls).map(el => el.textContent.trim()).filter(t => /\d/.test(t)).join(' | ');

  console.log(`  昵称: ${result.profile.nickname}`);
  console.log(`  简介: ${result.profile.bio?.substring(0, 40) || '(空)'}`);

  // ==========================================
  // 3. DOM 视频卡片提取
  // ==========================================
  console.log('\n🔍 [3/6] 提取视频列表...');

  const cardSelectors = [
    '[data-e2e="user-post-item"]',
    'li[class*="video"]',
    'div[class*="post-item"]',
    'div[class*="waterfall"] > div',
    'ul[class*="list"] > li',
    '[class*="video-card"]',
    'a[href*="/video/"]'
  ];

  const allCards = [];
  const seenHrefs = new Set();

  for (const sel of cardSelectors) {
    document.querySelectorAll(sel).forEach(el => {
      // 找最近的链接
      const link = el.closest('a[href*="/video/"]') || el.querySelector('a[href*="/video/"]');
      const href = link?.href || '';
      if (href && seenHrefs.has(href)) return;
      if (href) seenHrefs.add(href);

      // 找封面图（越高清越好）
      const img = el.querySelector('img');
      const coverSrc = img?.src || img?.getAttribute('data-src') || img?.getAttribute('srcset')?.split(' ')[0] || '';

      // 去掉低清 watermark，尝试换高清
      let hdCover = coverSrc;
      if (hdCover.includes('douyinpic.com')) {
        hdCover = hdCover.replace(/cover\/[^/]+\//, 'cover/1080x1080/');
      }

      const titleEl = el.querySelector('[class*="title"], [class*="desc"], [class*="text"], [class*="caption"]');
      const title = titleEl?.textContent?.trim() || '';

      const likeEl = el.querySelector('[class*="like"], [class*="fav"], [class*="digg"], [class*="count"], [class*="stat"]');
      const likeCount = likeEl?.textContent?.trim() || '';

      if (coverSrc || title) {
        allCards.push({
          index: allCards.length + 1,
          title,
          coverUrl: coverSrc,
          coverHd: hdCover,
          videoUrl: href,
          likeCount
        });

        // 收集高清封面到 images
        if (hdCover && !result.images.find(i => i.url === hdCover)) {
          result.images.push({ url: hdCover, source: 'video-cover-hd' });
        }
      }
    });
  }

  result.videos = allCards;
  console.log(`  ✅ 找到 ${allCards.length} 个视频`);

  // ==========================================
  // 4. 页面所有 douyin CDN 图片
  // ==========================================
  console.log('\n🔍 [4/6] 扫描页面所有抖音 CDN 图片...');

  document.querySelectorAll('img').forEach(img => {
    const src = img.src || img.getAttribute('data-src') || '';
    const cdnPatterns = ['douyinpic.com', 'pstatp.com', 'douyinvod.com', 'snssdk.com', 'byteimg.com', 'ixigua.com', 'p3-pc.douyinpic.com'];
    if (cdnPatterns.some(p => src.includes(p))) {
      if (!result.images.find(i => i.url === src)) {
        result.images.push({ url: src, source: 'dom-img-tag' });
      }
    }
  });

  // 也从背景图提取
  document.querySelectorAll('[style*="background"]').forEach(el => {
    const bg = el.style.backgroundImage || window.getComputedStyle(el).backgroundImage;
    const match = bg?.match(/url\(["']?([^"')]+)["']?\)/);
    if (match && cdnPatterns.some(p => match[1].includes(p))) {
      if (!result.images.find(i => i.url === match[1])) {
        result.images.push({ url: match[1], source: 'css-bg' });
      }
    }
  });

  console.log(`  ✅ 共收集 ${result.images.length} 张图片 URL`);

  // ==========================================
  // 5. 尝试拦截 XHR/fetch 响应（近期请求缓存）
  // ==========================================
  console.log('\n🔍 [5/6] 检查 Performance API 网络请求...');

  try {
    const entries = performance.getEntriesByType('resource');
    entries.forEach(entry => {
      const url = entry.name;
      if (/douyinpic\.com|pstatp\.com|douyinvod\.com/.test(url) && url.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
        if (!result.images.find(i => i.url === url)) {
          result.images.push({ url, source: 'performance-api', size: entry.transferSize });
        }
      }
      // 找 API 响应
      if (url.includes('/aweme/v1/web/') || url.includes('/api/')) {
        result.api_endpoints = result.api_endpoints || [];
        if (!result.api_endpoints.find(e => e.url === url)) {
          result.api_endpoints.push({ url, type: entry.initiatorType });
        }
      }
    });
  } catch(e) {}

  // ==========================================
  // 6. 导出
  // ==========================================
  console.log('\n🔍 [6/6] 生成下载文件...\n');

  // 清理：只保留前 50 张最有用的图片
  result.images = result.images.slice(0, 50);

  console.log('==========================================');
  console.log('📊 提取结果:');
  console.log(`  昵称:     ${result.profile.nickname || '❌ 未找到'}`);
  console.log(`  头像:     ${result.profile.avatar ? '✅' : '❌'}`);
  console.log(`  简介:     ${result.profile.bio ? '✅ ' + result.profile.bio.slice(0, 30) + '...' : '❌'}`);
  console.log(`  视频数:   ${result.videos.length} 个`);
  console.log(`  图片URL:  ${result.images.length} 张`);
  console.log(`  数据源:   ${result.raw_data_hints.length} 个`);
  console.log('==========================================\n');

  // ---- 下载 JSON ----
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'douyin_data.json';
  a.click();
  URL.revokeObjectURL(url);
  console.log('💾 douyin_data.json 已下载！');

  // ---- 批量打开高清封面图（方便右键另存） ----
  if (result.videos.length > 0) {
    console.log('\n📸 视频封面图列表（复制链接到新标签页打开即可下载）:');
    result.videos.forEach((v, i) => {
      if (v.coverHd || v.coverUrl) {
        console.log(`  [${i + 1}] ${v.coverHd || v.coverUrl}`);
      }
    });
  }

  // ---- 弹窗批量下载封面 ----
  if (result.videos.filter(v => v.coverHd || v.coverUrl).length > 0) {
    const downloadAll = confirm(
      `找到 ${result.videos.length} 个视频！\n\n` +
      '是否自动打开前 8 张封面图？\n' +
      '（每张在新标签页打开，你右键另存到 sucaiku/ 即可）\n\n' +
      '⚠️ 浏览器可能会拦截弹窗，请允许弹出窗口'
    );
    if (downloadAll) {
      let count = 0;
      result.videos.forEach((v, i) => {
        if (count >= 8) return;
        const imgUrl = v.coverHd || v.coverUrl;
        if (imgUrl) {
          count++;
          setTimeout(() => {
            const w = window.open(imgUrl, '_blank');
            if (!w) console.log(`  ⚠️ 弹窗被拦截，请手动复制上面的链接打开`);
          }, i * 600);
        }
      });
      console.log(`  🖼️  正在打开 ${Math.min(8, result.videos.length)} 张封面图...`);
    }
  }

  console.log('\n✅ 提取完成！');
  console.log('   json 文件: douyin_data.json（已自动下载）');
  console.log('   图片: 弹窗打开后右键"另存为"到 d:\\网站\\sucaiku\\');
  console.log('   或者从上面打印的链接逐个打开下载\n');

  // 返回给调用方
  return result;

})();
