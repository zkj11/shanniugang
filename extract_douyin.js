/**
 * 汕牛港火锅 — 抖音素材一键提取
 *
 * 怎么用：
 * 1. 浏览器打开抖音主页 https://v.douyin.com/8cD-8Dacl0A/
 * 2. 等页面加载好，多往下滚几屏（加载更多视频）
 * 3. F12 → 控制台 → 粘贴全部 → 回车
 * 4. 自动下载数据文件 + 弹窗打开封面图
 */

(async function () {
  console.clear();
  console.log('🔥 汕牛港抖音数据提取');
  console.log('━━━━━━━━━━━━━━━━━━━━\n');

  const 数据 = { 时间: new Date().toISOString(), 资料: {}, 视频: [], 图片: [] };

  // ── 第1步：挖页面隐藏数据 ──
  console.log('⏳ 正在扫描页面数据...');
  const 关键词 = ['__NUXT__', '__NEXT_DATA__', '__INITIAL_STATE__', '__DOUYIN_DATA__', 'pageData'];
  for (const k of 关键词) {
    try {
      if (window[k]) {
        const str = JSON.stringify(window[k]);
        const 图片列表 = str.match(/https?:\/\/[^"'\s]*?(douyinpic|pstatp|douyinvod|snssdk|byteimg)[^"'\s]*/gi) || [];
        图片列表.forEach(url => { if (!数据.图片.find(i => i.url === url)) 数据.图片.push({ url }); });
      }
    } catch(e) {}
  }

  // ── 第2步：提取头像、昵称、简介 ──
  const 找文字 = (选择器列表) => {
    for (const s of 选择器列表) {
      const el = document.querySelector(s);
      if (el?.textContent?.trim()) return el.textContent.trim();
    }
    return '';
  };
  数据.资料.昵称 = 找文字(['[data-e2e="user-title"]', 'h1', '[class*="nickname"]', '[class*="user-name"]']);
  数据.资料.简介 = 找文字(['[data-e2e="user-desc"]', '[class*="signature"]', '[class*="bio"]']);

  const 头像图 = document.querySelector('[data-e2e="user-avatar"] img, [class*="avatar"] img');
  if (头像图) 数据.资料.头像 = 头像图.src;

  // ── 第3步：提取视频列表 ──
  const 所有链接 = new Set();
  document.querySelectorAll('a[href*="/video/"]').forEach(a => {
    const href = a.href;
    if (所有链接.has(href)) return;
    所有链接.add(href);

    const 卡片 = a.closest('li, div[class*="item"], div[class*="card"]') || a;
    const 图 = 卡片.querySelector('img');
    const 封面 = 图?.src || 图?.getAttribute('data-src') || '';
    const 标题 = 卡片.querySelector('[class*="title"], [class*="desc"]')?.textContent?.trim() || '';

    if (封面) {
      数据.视频.push({ 序号: 数据.视频.length + 1, 标题, 封面, 链接: href });
      if (!数据.图片.find(i => i.url === 封面)) 数据.图片.push({ url: 封面 });
    }
  });

  // ── 第4步：页面所有抖音CDN图片 ──
  document.querySelectorAll('img').forEach(img => {
    const src = img.src || img.getAttribute('data-src') || '';
    if (/douyinpic|pstatp|douyinvod|snssdk|byteimg/.test(src)) {
      if (!数据.图片.find(i => i.url === src)) 数据.图片.push({ url: src });
    }
  });

  // ── 第5步：打印结果 ──
  console.log('━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 提取结果：');
  console.log('  昵称：' + (数据.资料.昵称 || '❌ 没找到'));
  console.log('  简介：' + (数据.资料.简介?.slice(0, 50) || '❌ 没找到'));
  console.log('  视频：' + 数据.视频.length + ' 个');
  console.log('  图片：' + 数据.图片.length + ' 张');
  console.log('━━━━━━━━━━━━━━━━━━━━\n');

  // ── 下载 JSON ──
  const blob = new Blob([JSON.stringify(数据, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'douyin_data.json'; a.click();
  URL.revokeObjectURL(url);
  console.log('💾 已下载：douyin_data.json');

  // ── 弹窗打开封面图 ──
  if (数据.视频.length > 0) {
    console.log('\n📸 正在打开封面图（请允许弹窗）...');
    console.log('   在新标签页右键 → 图片另存为 → 放到 sucaiku/ 文件夹\n');
    let 已打开 = 0;
    数据.视频.forEach((v, i) => {
      if (已打开 >= 8) return;
      if (v.封面) {
        已打开++;
        setTimeout(() => window.open(v.封面, '_blank'), i * 500);
      }
    });
  }

  console.log('✅ 搞定！图片保存到 d:\\网站\\sucaiku\\ 即可');
})();
