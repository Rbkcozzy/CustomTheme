// ==================== FUNGSI CUACA ====================
async function getWeather() {
    const latitude = -1.142421;
    const longitude = 116.867846;
    const cityName = "Balikpapan";
    
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
        );
        if (!response.ok) throw new Error('Gagal mengambil data cuaca');
        
        const data = await response.json();
        document.getElementById("weather-temp").innerText = 
            Math.round(data.current_weather.temperature) + "°C";
        document.getElementById("weather-city").innerText = cityName;
        
    } catch (error) {
        console.error('Error mengambil data cuaca:', error);
        document.getElementById("weather-temp").innerText = "--°C";
    }
}

function getWeatherCondition(code) {
    const weatherCodes = {
        0: 'Cerah', 1: 'Cerah', 2: 'Berawan', 3: 'Berawan',
        45: 'Berkabut', 48: 'Berkabut', 51: 'Gerimis', 53: 'Gerimis', 55: 'Gerimis',
        61: 'Hujan Ringan', 63: 'Hujan Sedang', 65: 'Hujan Lebat',
        71: 'Salju Ringan', 73: 'Salju Sedang', 75: 'Salju Lebat', 77: 'Butiran Salju',
        80: 'Hujan', 81: 'Hujan', 82: 'Hujan', 85: 'Salju', 86: 'Salju', 95: 'Badai Petir'
    };
    return weatherCodes[code] || 'Tidak diketahui';
}

// ==================== FUNGSI CLOCK ====================
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById("clock").innerText =
        hours + ":" + minutes + ":" + seconds + ", " +
        now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ==================== HISTORI PENELUSURAN ====================
const MAX_HISTORY = 8;

function getHistory() {
    return JSON.parse(localStorage.getItem('searchHistory') || '[]');
}

function saveHistory(history) {
    localStorage.setItem('searchHistory', JSON.stringify(history));
}

function addToHistory(query) {
    if (!query.trim()) return;
    let history = getHistory();
    // Hapus duplikat jika ada
    history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
    // Tambahkan ke depan
    history.unshift(query);
    // Batasi jumlah histori
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    saveHistory(history);
}

function deleteHistoryItem(index) {
    const history = getHistory();
    history.splice(index, 1);
    saveHistory(history);
    renderHistoryDropdown(document.getElementById('search').value);
}

function clearAllHistory() {
    saveHistory([]);
    hideHistoryDropdown();
}

function renderHistoryDropdown(filter = '') {
    const dropdown = document.getElementById('search-history-dropdown');
    const history = getHistory();
    const filtered = filter.trim()
        ? history.filter(item => item.toLowerCase().includes(filter.toLowerCase()))
        : history;

    if (filtered.length === 0) {
        hideHistoryDropdown();
        return;
    }

    let html = `
        <div class="history-header">
            <span class="history-label">Histori</span>
            <button class="history-clear-btn" id="history-clear-btn">Hapus semua</button>
        </div>
    `;

    filtered.forEach((item, index) => {
        const originalIndex = history.indexOf(item);
        html += `
            <div class="history-item" data-index="${originalIndex}" data-query="${escapeHtml(item)}">
                <span class="history-item-text">${escapeHtml(item)}</span>
                <button class="history-delete-btn" data-index="${originalIndex}" title="Hapus">×</button>
            </div>
        `;
    });

    dropdown.innerHTML = html;
    dropdown.classList.add('show');

    // Event: klik item histori
    dropdown.querySelectorAll('.history-item').forEach(el => {
        el.addEventListener('mousedown', function(e) {
            if (e.target.classList.contains('history-delete-btn')) return;
            const query = this.dataset.query;
            window.location.href = "https://www.google.com/search?q=" + encodeURIComponent(query);
        });
    });

    // Event: hapus satu item
    dropdown.querySelectorAll('.history-delete-btn').forEach(btn => {
        btn.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            deleteHistoryItem(parseInt(this.dataset.index));
        });
    });

    // Event: hapus semua
    const clearBtn = dropdown.querySelector('#history-clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            clearAllHistory();
        });
    }
}

function hideHistoryDropdown() {
    document.getElementById('search-history-dropdown').classList.remove('show');
}

function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ==================== FUNGSI FAVORIT ====================
function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function saveFavorites(favs) {
    localStorage.setItem('favorites', JSON.stringify(favs));
}

function addFavorite(name, url) {
    const favs = getFavorites();
    // Pastikan URL punya protokol
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    favs.push({ name, url });
    saveFavorites(favs);
    renderFavorites();
}

function deleteFavorite(index) {
    const favs = getFavorites();
    favs.splice(index, 1);
    saveFavorites(favs);
    renderFavorites();
}

function getFaviconUrl(url) {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
        return '';
    }
}

function renderFavorites() {
    const list = document.getElementById('favorites-list');
    const favs = getFavorites();

    if (favs.length === 0) {
        list.innerHTML = '<div class="favorites-empty">Belum ada favorit</div>';
        return;
    }

    list.innerHTML = favs.map((fav, index) => `
        <a class="fav-item" href="${escapeHtml(fav.url)}" title="${escapeHtml(fav.url)}">
            <img class="fav-favicon" src="${getFaviconUrl(fav.url)}" alt="" onerror="this.style.display='none'">
            <span class="fav-name">${escapeHtml(fav.name)}</span>
            <button class="fav-delete-btn" data-index="${index}" title="Hapus">×</button>
        </a>
    `).join('');

    // Event hapus favorit
    list.querySelectorAll('.fav-delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            deleteFavorite(parseInt(this.dataset.index));
        });
    });
}

// ==================== MODAL TAMBAH FAVORIT ====================
function openModal() {
    document.getElementById('modal-backdrop').classList.add('show');
    document.getElementById('fav-name').value = '';
    document.getElementById('fav-url').value = '';
    setTimeout(() => document.getElementById('fav-name').focus(), 50);
}

function closeModal() {
    document.getElementById('modal-backdrop').classList.remove('show');
}

// ==================== SEARCH EVENT ====================
const searchInput = document.getElementById("search");

searchInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        const query = this.value.trim();
        if (!query) return;
        addToHistory(query);
        window.location.href = "https://www.google.com/search?q=" + encodeURIComponent(query);
    }
});

searchInput.addEventListener("input", function() {
    renderHistoryDropdown(this.value);
});

searchInput.addEventListener("focus", function() {
    renderHistoryDropdown(this.value);
});

searchInput.addEventListener("blur", function() {
    setTimeout(hideHistoryDropdown, 150);
});

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Clock
    setInterval(updateClock, 1000);
    updateClock();

    // Cuaca
    getWeather();
    setInterval(getWeather, 1800000);

    // Favorit
    renderFavorites();

    // Tombol tambah favorit
    document.getElementById('add-fav-btn').addEventListener('click', openModal);

    // Modal cancel
    document.getElementById('modal-cancel').addEventListener('click', closeModal);

    // Modal backdrop click
    document.getElementById('modal-backdrop').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    // Modal save
    document.getElementById('modal-save').addEventListener('click', function() {
        const name = document.getElementById('fav-name').value.trim();
        const url = document.getElementById('fav-url').value.trim();
        if (!name || !url) {
            alert('Nama dan URL tidak boleh kosong!');
            return;
        }
        addFavorite(name, url);
        closeModal();
    });

    // Shortcut Enter di modal
    document.getElementById('fav-url').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') document.getElementById('modal-save').click();
    });
});
