/**
 * 汕牛港潮汕鲜牛肉火锅 — 官网交互脚本
 * 滚动 / 导航 / 菜单Tab / 图库灯箱 / 百度地图 / 复制地址
 */
(function () {
  'use strict';

  // ==================== DOM REFS ====================
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const menuTabs = document.getElementById('menuTabs');
  const galleryGrid = document.getElementById('galleryGrid');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const copyAddressBtn = document.getElementById('copyAddress');
  const mobileCtaBar = document.getElementById('mobileCtaBar');
  const wechatQR = document.getElementById('wechatQR');

  let currentLightboxIndex = 0;
  let galleryImages = [];

  // ==================== NAVBAR SCROLL ====================
  function updateNavbar() {
    if (!navbar) return;
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar(); // init

  // ==================== MOBILE NAV TOGGLE ====================
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      this.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Close nav when clicking a link
    navLinks.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });

    // Close nav when clicking outside
    document.addEventListener('click', function (e) {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
      }
    });
  }

  // ==================== MENU TABS ====================
  if (menuTabs) {
    menuTabs.addEventListener('click', function (e) {
      var tab = e.target.closest('.menu-tab');
      if (!tab) return;

      // Update tabs
      menuTabs.querySelectorAll('.menu-tab').forEach(function (t) {
        t.classList.remove('active');
      });
      tab.classList.add('active');

      // Update panels
      var targetId = 'panel-' + tab.dataset.tab;
      document.querySelectorAll('.menu-panel').forEach(function (panel) {
        panel.classList.remove('active');
      });
      var target = document.getElementById(targetId);
      if (target) target.classList.add('active');
    });
  }

  // ==================== GALLERY: LOAD IMAGES FROM SUCAIKU ====================
  function initGallery() {
    if (!galleryGrid) return;

    // 优先加载 sucaiku/ 里的实际文件，然后尝试标准命名
    var tryImages = [
      // 已放入的实际文件
      '微信图片_20260714220939_32_9.png',
      '微信图片_20260714220940_33_9.png',
      '微信图片_20260714220941_34_9.png',
      '微信图片_20260714221815_40_9.jpg',
      '微信图片_20260714221816_41_9.jpg',
      '微信图片_20260714221817_42_9.jpg',
      '微信图片_20260714221818_43_9.jpg',
      '微信图片_20260714221819_44_9.jpg',
      // 备用标准命名
      'store-front.jpg', 'store-interior.jpg', 'beef-platter.jpg',
      'beef-cut.jpg', 'beef-balls.jpg', 'hotpot-boiling.jpg',
      'dipping-sauce.jpg', 'group-dining.jpg', 'beef-detail.jpg',
      'hero-bg.jpg'
    ];

    var loadedCount = 0;
    var images = [];

    tryImages.forEach(function (name, index) {
      var img = new Image();
      img.onload = function () {
        images.push({ src: 'sucaiku/' + name, alt: name.replace(/\.(jpg|png|webp)$/, '').replace(/-/g, ' ') });
        loadedCount++;
        if (loadedCount === tryImages.length || loadedCount === images.length) {
          renderGallery(images);
        }
      };
      img.onerror = function () {
        loadedCount++;
        if (loadedCount === tryImages.length) {
          renderGallery(images);
        }
      };
      img.src = 'sucaiku/' + name;
    });

    // Timeout fallback: if images take too long, render what we have
    setTimeout(function () {
      renderGallery(images);
    }, 3000);
  }

  function renderGallery(images) {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';

    if (images.length === 0) {
      // No real images found — show placeholder gallery
      var placeholders = [
        { emoji: '🏠', label: '门店门头' },
        { emoji: '🍲', label: '店内环境' },
        { emoji: '🥩', label: '鲜切牛肉' },
        { emoji: '🍡', label: '手打牛丸' },
        { emoji: '🥣', label: '蘸料台' },
        { emoji: '🔥', label: '沸腾火锅' },
        { emoji: '👨‍🍳', label: '明档切肉' },
        { emoji: '🥬', label: '涮菜搭配' }
      ];

      placeholders.forEach(function (p, i) {
        var item = document.createElement('div');
        item.className = 'gallery-item';
        item.setAttribute('data-index', i);
        item.innerHTML = '<div class="gallery-placeholder" style="background:linear-gradient(135deg,' +
          (i % 2 === 0 ? 'var(--red-light)20,var(--gold)30' : 'var(--gold)20,var(--red-light)30') +
          ')"><span style="font-size:36px">' + p.emoji + '</span></div>' +
          '<span style="position:absolute;bottom:8px;left:8px;font-size:11px;color:var(--brown-light);background:rgba(255,255,255,.9);padding:2px 8px;border-radius:4px">' + p.label + '</span>';
        galleryGrid.appendChild(item);
      });

      // Update gallery items for lightbox (placeholder mode)
      galleryImages = placeholders.map(function (p) { return { src: null, alt: p.label, emoji: p.emoji }; });
      initLightboxItems();
      return;
    }

    // Real images
    var labels = ['门店实拍', '店内环境', '鲜切牛肉', '潮汕火锅', '牛肉特写', '菜品实拍', '蘸料搭配', '食客用餐'];
    images.forEach(function (img, i) {
      var label = labels[i] || ('图片 ' + (i + 1));
      var item = document.createElement('div');
      item.className = 'gallery-item';
      item.setAttribute('data-index', i);
      item.innerHTML = '<img src="' + img.src + '" alt="' + label + '" loading="lazy">' +
        '<span style="position:absolute;bottom:8px;left:8px;font-size:11px;color:var(--brown-light);background:rgba(255,255,255,.9);padding:2px 8px;border-radius:4px">' + label + '</span>';
      galleryGrid.appendChild(item);
    });

    galleryImages = images.map(function(img, i) {
      return { src: img.src, alt: labels[i] || img.alt };
    });
    initLightboxItems();
  }

  // ==================== LIGHTBOX ====================
  function initLightboxItems() {
    var items = galleryGrid.querySelectorAll('.gallery-item');
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        currentLightboxIndex = parseInt(this.getAttribute('data-index'));
        openLightbox(currentLightboxIndex);
      });
    });
  }

  function openLightbox(index) {
    if (!lightbox || !lightboxImg) return;
    var img = galleryImages[index];
    if (!img) return;

    if (img.src) {
      lightboxImg.src = img.src;
      lightboxImg.style.display = 'block';
    } else {
      // Placeholder mode: show emoji
      lightboxImg.style.display = 'none';
      // Could show text overlay instead
    }
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    updateLightboxButtons();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function prevImage() {
    if (galleryImages.length === 0) return;
    currentLightboxIndex = (currentLightboxIndex - 1 + galleryImages.length) % galleryImages.length;
    openLightbox(currentLightboxIndex);
  }

  function nextImage() {
    if (galleryImages.length === 0) return;
    currentLightboxIndex = (currentLightboxIndex + 1) % galleryImages.length;
    openLightbox(currentLightboxIndex);
  }

  function updateLightboxButtons() {
    if (lightboxPrev) lightboxPrev.style.display = galleryImages.length > 1 ? 'flex' : 'none';
    if (lightboxNext) lightboxNext.style.display = galleryImages.length > 1 ? 'flex' : 'none';
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', prevImage);
  if (lightboxNext) lightboxNext.addEventListener('click', nextImage);
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Keyboard navigation for lightbox
  document.addEventListener('keydown', function (e) {
    if (!lightbox || !lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
  });

  // ==================== BAIDU MAP ====================
  // 申请免费 AK 后，取消 index.html 中百度地图 script 的注释即可启用
  // 详见：https://lbsyun.baidu.com/
  function initMap() {
    var mapContainer = document.getElementById('baiduMap');
    if (!mapContainer) return; // 没有地图容器则跳过

    if (typeof BMapGL === 'undefined') return; // 未加载 API 则静默跳过

    try {
      var map = new BMapGL.Map('baiduMap');
      var address = '苏州市张家港市塘桥镇北京路222号';
      var geocoder = new BMapGL.Geocoder();
      geocoder.getPoint(address, function (point) {
        if (point) {
          map.centerAndZoom(point, 17);
          var marker = new BMapGL.Marker(point);
          map.addOverlay(marker);
          var infoWindow = new BMapGL.InfoWindow(
            '<div style="padding:4px;font-size:14px;line-height:1.6">' +
            '<strong style="color:#C41E1A">🐂 汕牛港潮汕鲜牛肉火锅</strong><br>' +
            '塘桥镇北京路222-224-226号<br>' +
            '人均 ¥72 · 评分 4.8</div>',
            { width: 240, title: '' }
          );
          marker.addEventListener('click', function () {
            map.openInfoWindow(infoWindow, point);
          });
          map.openInfoWindow(infoWindow, point);
          map.enableScrollWheelZoom();
        }
      });
    } catch (e) {
      console.warn('Baidu Map init failed:', e);
    }
  }

  // 只有 baiduMap 容器存在且 API 加载时才初始化
  if (document.getElementById('baiduMap') && typeof BMapGL !== 'undefined') {
    initMap();
  }

  // ==================== COPY ADDRESS ====================
  if (copyAddressBtn) {
    copyAddressBtn.addEventListener('click', function () {
      var address = '江苏省苏州市张家港市塘桥镇北京路222-224-226号';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(address).then(function () {
          var origText = copyAddressBtn.textContent;
          copyAddressBtn.textContent = '✅ 已复制！';
          copyAddressBtn.style.background = '#4caf50';
          copyAddressBtn.style.color = '#fff';
          setTimeout(function () {
            copyAddressBtn.textContent = origText;
            copyAddressBtn.style.background = '';
            copyAddressBtn.style.color = '';
          }, 2000);
        }).catch(function () {
          fallbackCopy(address);
        });
      } else {
        fallbackCopy(address);
      }
    });

    function fallbackCopy(text) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        copyAddressBtn.textContent = '✅ 已复制！';
        setTimeout(function () {
          copyAddressBtn.textContent = '📋 复制地址';
        }, 2000);
      } catch (err) {
        prompt('请手动复制地址：', text);
      }
      document.body.removeChild(textarea);
    }
  }

  // ==================== WECHAT QR ====================
  if (wechatQR) {
    var qrImg = new Image();
    qrImg.onload = function () {
      wechatQR.innerHTML = '';
      wechatQR.appendChild(qrImg);
      wechatQR.style.border = 'none';
    };
    qrImg.src = 'sucaiku/qr-wechat.png';
  }

  // ==================== MOBILE CTA BAR ====================
  function updateMobileCta() {
    if (!mobileCtaBar) return;
    // Hide when near footer
    var footer = document.querySelector('.footer');
    if (!footer) return;
    var footerTop = footer.getBoundingClientRect().top;
    var windowHeight = window.innerHeight;
    if (footerTop < windowHeight + 100) {
      mobileCtaBar.style.opacity = '0';
      mobileCtaBar.style.pointerEvents = 'none';
    } else {
      mobileCtaBar.style.opacity = '1';
      mobileCtaBar.style.pointerEvents = 'auto';
    }
  }
  window.addEventListener('scroll', updateMobileCta, { passive: true });

  // ==================== INIT ====================
  function init() {
    updateNavbar();
    initGallery();
    updateMobileCta();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==================== EXPORT FOR DEBUG ====================
  window.__shanniugang = {
    initMap: initMap,
    openLightbox: openLightbox,
    closeLightbox: closeLightbox
  };

})();
