// ===== STATE =====
let currentProvince = null;
let currentDistrict = null;
let currentRegionFilter = 'all';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initStats();
  renderProvinceGrid('province-grid', THAI_DATA);
  renderPopularRestaurants();
});

// ===== STATS =====
function initStats() {
  let totalDistricts = 0;
  let totalRestaurants = 0;
  THAI_DATA.forEach(p => {
    totalDistricts += p.districts.length;
    p.districts.forEach(d => totalRestaurants += d.restaurants.length);
  });
  animateNumber('stat-provinces', THAI_DATA.length);
  animateNumber('stat-districts', totalDistricts);
  animateNumber('stat-restaurants', totalRestaurants);
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  let current = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 30);
}

// ===== PAGE NAVIGATION =====
function showPage(pageId) {
  ['page-home', 'page-province', 'page-all-provinces', 'page-about'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(pageId).classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showHome() {
  showPage('page-home');
  setActiveNav(0);
}

function showAllProvinces() {
  renderProvinceGrid('all-province-grid', ALL_PROVINCES);
  showPage('page-all-provinces');
  setActiveNav(1);
}

function showAbout() {
  showPage('page-about');
  setActiveNav(2);
}

function setActiveNav(index) {
  document.querySelectorAll('.nav-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });
}

// ===== PROVINCE GRID =====
function renderProvinceGrid(containerId, provinces) {
  const container = document.getElementById(containerId);
  const filtered = currentRegionFilter === 'all'
    ? provinces
    : provinces.filter(p => p.region === currentRegionFilter);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🗺️</div><div class="empty-state-text">ไม่พบจังหวัดในภูมิภาคนี้</div></div>`;
    return;
  }

  container.innerHTML = filtered.map(province => {
    const totalRestaurants = province.districts.reduce((sum, d) => sum + d.restaurants.length, 0);
    return `
      <div class="province-card" onclick="openProvince('${province.id}')">
        <div class="province-card-region">${province.regionName}</div>
        <div class="province-card-emoji">${province.emoji}</div>
        <div class="province-card-name">${province.name}</div>
        <div class="province-card-name-en">${province.nameEn}</div>
        <div class="province-card-count">
          ${totalRestaurants > 0 ? `🍽️ ${totalRestaurants} ร้าน` : '🔜 เร็วๆ นี้'}
        </div>
      </div>
    `;
  }).join('');
}

function filterRegion(region, btn) {
  currentRegionFilter = region;
  document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProvinceGrid('province-grid', THAI_DATA);
}

// ===== OPEN PROVINCE =====
function openProvince(provinceId) {
  const province = ALL_PROVINCES.find(p => p.id === provinceId);
  if (!province) return;

  if (province.districts.length === 0) {
    alert(`ยังไม่มีข้อมูลร้านอาหารใน${province.name} กำลังรวบรวมข้อมูล...`);
    return;
  }

  currentProvince = province;
  currentDistrict = null;

  // Set province page content
  document.getElementById('province-page-emoji').textContent = province.emoji;
  document.getElementById('province-page-title').textContent = province.name;
  document.getElementById('province-page-desc').textContent = province.desc;
  document.getElementById('province-breadcrumb').textContent = `หน้าแรก › ${province.name}`;

  const totalDistricts = province.districts.length;
  const totalRestaurants = province.districts.reduce((s, d) => s + d.restaurants.length, 0);
  document.getElementById('province-page-stats').innerHTML = `
    <div class="province-stat"><div class="province-stat-num">${totalDistricts}</div><div class="province-stat-label">เขต/อำเภอ</div></div>
    <div class="province-stat"><div class="province-stat-num">${totalRestaurants}</div><div class="province-stat-label">ร้านอาหาร</div></div>
  `;

  // District tabs
  const tabsContainer = document.getElementById('district-tabs');
  tabsContainer.innerHTML = `
    <button class="district-tab active" onclick="selectDistrict(null, this)">ทั้งหมด</button>
    ${province.districts.map(d => `
      <button class="district-tab" onclick="selectDistrict('${d.id}', this)">${d.name}</button>
    `).join('')}
  `;

  // Clear search
  document.getElementById('district-search').value = '';

  renderDistrictRestaurants(null);
  showPage('page-province');
}

function selectDistrict(districtId, btn) {
  currentDistrict = districtId;
  document.querySelectorAll('.district-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('district-search').value = '';
  renderDistrictRestaurants(districtId);
}

function renderDistrictRestaurants(districtId, searchQuery = '') {
  if (!currentProvince) return;
  const container = document.getElementById('district-restaurants');

  let restaurants = [];
  if (districtId) {
    const district = currentProvince.districts.find(d => d.id === districtId);
    if (district) restaurants = district.restaurants;
  } else {
    currentProvince.districts.forEach(d => restaurants.push(...d.restaurants));
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    restaurants = restaurants.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  if (restaurants.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">ไม่พบร้านอาหาร</div><div class="empty-state-sub">ลองค้นหาด้วยคำอื่น</div></div>`;
    return;
  }

  container.innerHTML = restaurants.map(r => renderRestaurantCard(r)).join('');
}

function filterDistrictRestaurants(query) {
  renderDistrictRestaurants(currentDistrict, query);
}

// ===== POPULAR RESTAURANTS =====
function renderPopularRestaurants() {
  const container = document.getElementById('popular-grid');
  const popular = [];
  THAI_DATA.forEach(province => {
    province.districts.forEach(district => {
      district.restaurants.forEach(r => {
        if (r.recommended) popular.push({ ...r, provinceName: province.name, provinceId: province.id });
      });
    });
  });
  popular.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  const top = popular.slice(0, 6);
  container.innerHTML = top.map(r => renderRestaurantCard(r, r.provinceName)).join('');
}

// ===== RESTAURANT CARD =====
function renderRestaurantCard(r, provinceLabel = null) {
  const stars = getStars(r.rating);
  const badge = r.recommended ? '<span class="restaurant-badge">⭐ แนะนำ</span>' : '';
  const locationText = provinceLabel
    ? `📍 ${provinceLabel}`
    : `📍 ${r.address.split(' ')[0]}`;

  return `
    <div class="restaurant-card" onclick="openRestaurantModal(${r.id})">
      <div class="restaurant-card-header">
        <div class="restaurant-emoji">${r.emoji}</div>
        <div>
          <div class="restaurant-card-name">${r.name}</div>
          <div class="restaurant-card-type">${r.type}</div>
        </div>
        ${badge}
      </div>
      <div class="restaurant-card-body">
        <div class="restaurant-rating">
          <div class="stars">${stars}</div>
          <span class="rating-num">${r.rating}</span>
          <span class="rating-count">(${r.reviews.toLocaleString()} รีวิว)</span>
        </div>
        <div class="price-tag">💰 ${r.price} บาท</div>
        <div class="tags-row">
          ${r.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
      <div class="restaurant-card-footer">
        <span class="location-text">${locationText}</span>
        <button class="detail-btn" onclick="event.stopPropagation(); openRestaurantModal(${r.id})">ดูรายละเอียด</button>
      </div>
    </div>
  `;
}

function getStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ===== RESTAURANT MODAL =====
function openRestaurantModal(restaurantId) {
  let restaurant = null;
  let provinceName = '';
  let districtName = '';

  THAI_DATA.forEach(p => {
    p.districts.forEach(d => {
      const r = d.restaurants.find(r => r.id === restaurantId);
      if (r) {
        restaurant = r;
        provinceName = p.name;
        districtName = d.name;
      }
    });
  });

  if (!restaurant) return;

  const stars = getStars(restaurant.rating);
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <div class="modal-emoji">${restaurant.emoji}</div>
      <div>
        <div class="modal-name">${restaurant.name}</div>
        <div class="modal-type">${restaurant.type}</div>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-section">
        <div class="modal-info-grid">
          <div class="modal-info-box">
            <div class="modal-info-box-label">คะแนน</div>
            <div class="modal-info-box-value">${restaurant.rating} <span style="color:#f39c12;font-size:14px">${stars}</span></div>
          </div>
          <div class="modal-info-box">
            <div class="modal-info-box-label">จำนวนรีวิว</div>
            <div class="modal-info-box-value">${restaurant.reviews.toLocaleString()}</div>
          </div>
          <div class="modal-info-box">
            <div class="modal-info-box-label">ราคาเฉลี่ย</div>
            <div class="modal-info-box-value" style="color:#27ae60">${restaurant.price} บาท</div>
          </div>
          <div class="modal-info-box">
            <div class="modal-info-box-label">ประเภท</div>
            <div class="modal-info-box-value" style="font-size:14px">${restaurant.type}</div>
          </div>
        </div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">เวลาเปิดให้บริการ</div>
        <div class="modal-hours">🕐 ${restaurant.hours}</div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">ที่อยู่</div>
        <div class="modal-section-value">📍 ${restaurant.address}</div>
        <div class="modal-section-value" style="margin-top:4px;color:#777;font-size:14px">เขต/อำเภอ: ${districtName} | จังหวัด: ${provinceName}</div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">แท็ก</div>
        <div class="modal-tags">
          ${restaurant.tags.map(t => `<span class="modal-tag">${t}</span>`).join('')}
          ${restaurant.recommended ? '<span class="modal-tag" style="background:#fff3cd;border-color:#f39c12;color:#856404">⭐ ร้านแนะนำ</span>' : ''}
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ===== HERO SEARCH =====
let heroSearchTimeout = null;

function handleHeroSearch(query) {
  clearTimeout(heroSearchTimeout);
  const resultsEl = document.getElementById('hero-search-results');
  if (!query.trim()) {
    resultsEl.classList.add('hidden');
    return;
  }
  heroSearchTimeout = setTimeout(() => {
    const results = searchAll(query);
    if (results.length === 0) {
      resultsEl.innerHTML = `<div class="search-result-item">ไม่พบผลลัพธ์สำหรับ "${query}"</div>`;
    } else {
      resultsEl.innerHTML = results.slice(0, 8).map(r => `
        <div class="search-result-item" onclick="${r.action}">
          <span>${r.emoji}</span>
          <span style="flex:1">${r.name}</span>
          <span class="search-result-type">${r.type}</span>
        </div>
      `).join('');
    }
    resultsEl.classList.remove('hidden');
  }, 200);
}

function handleHeroSearchBtn() {
  const query = document.getElementById('hero-search').value.trim();
  if (!query) return;
  const results = searchAll(query);
  if (results.length > 0) {
    const first = results[0];
    eval(first.action);
  }
}

function searchAll(query) {
  const q = query.toLowerCase();
  const results = [];

  ALL_PROVINCES.forEach(province => {
    if (province.name.includes(q) || province.nameEn.toLowerCase().includes(q)) {
      results.push({
        emoji: province.emoji,
        name: province.name,
        type: 'จังหวัด',
        action: `openProvince('${province.id}')`
      });
    }
    province.districts.forEach(district => {
      if (district.name.toLowerCase().includes(q)) {
        results.push({
          emoji: province.emoji,
          name: `${district.name} (${province.name})`,
          type: 'เขต/อำเภอ',
          action: `openProvince('${province.id}')`
        });
      }
      district.restaurants.forEach(r => {
        if (r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q))) {
          results.push({
            emoji: r.emoji,
            name: `${r.name} (${province.name})`,
            type: r.type,
            action: `openRestaurantModal(${r.id})`
          });
        }
      });
    });
  });

  return results;
}

// Hide search results when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-bar')) {
    document.getElementById('hero-search-results').classList.add('hidden');
  }
});
