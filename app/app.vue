<script setup lang="ts">
import { ref, computed } from 'vue'

// ==========================================
// 1. STATE & KONFIGURASI API (LARAVEL HERD)
// ==========================================
const config = useRuntimeConfig()
const defaultBase = config.public.apiBase || 'http://app.test/api'
const apiBase = ref(defaultBase)
const endpoint = ref('/alkes')
const activeNav = ref<'katalog' | 'pinjam' | 'tracking' | 'api-info'>('katalog')
const kategoriFilter = ref('Semua')

// Target URL API
const fullApiUrl = computed(() => {
  const base = apiBase.value.replace(/\/+$/, '')
  const ep = endpoint.value.startsWith('/') ? endpoint.value : `/${endpoint.value}`
  return `${base}${ep}`
})

// Fetch data Alat Kesehatan dari Backend Laravel Herd
const { data, pending, error, refresh } = await useFetch(fullApiUrl, {
  lazy: false,
  server: false,
  key: () => fullApiUrl.value,
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// ==========================================
// 2. DATA ALAT KESEHATAN (ALKES)
// Sinkron dengan Database Laravel atau Fallback
// ==========================================
const defaultAlkesList = [
  {
    id: 1,
    nama_alkes: 'Tensimeter Digital Otomatis (Sphygmomanometer)',
    kategori: 'Alat Diagnostik',
    stok: 15,
    kondisi: 'Tersedia',
    deskripsi: 'Alat pengukur tekanan darah digital akurat dengan layar LCD besar dan memori otomatis.',
    kode_alat: 'ALK-TNS-01',
    lokasi_lab: 'Lab Keperawatan & Diagnostik'
  },
  {
    id: 2,
    nama_alkes: 'Stetoskop Littmann Classic III',
    kategori: 'Alat Diagnostik',
    stok: 20,
    kondisi: 'Tersedia',
    deskripsi: 'Instrumen akustik sensitivitas tinggi untuk auskultasi suara jantung dan paru-paru.',
    kode_alat: 'ALK-STT-02',
    lokasi_lab: 'Lab Fisiologi & Praktikum'
  },
  {
    id: 3,
    nama_alkes: 'Pulse Oximeter Fingertip',
    kategori: 'Alat Diagnostik',
    stok: 25,
    kondisi: 'Tersedia',
    deskripsi: 'Pengukur saturasi oksigen (SpO2) dan denyut nadi praktis via ujung jari.',
    kode_alat: 'ALK-OXI-03',
    lokasi_lab: 'Lab Keperawatan Dasar'
  },
  {
    id: 4,
    nama_alkes: 'Termometer Inframerah Non-Contact',
    kategori: 'Alat Diagnostik',
    stok: 18,
    kondisi: 'Tersedia',
    deskripsi: 'Termometer dahi tanpa sentuh untuk deteksi cepat suhu tubuh dengan alarm demam.',
    kode_alat: 'ALK-TRM-04',
    lokasi_lab: 'Lab Kedaruratan Medis'
  },
  {
    id: 5,
    nama_alkes: 'Nebulizer Kompresor Portable',
    kategori: 'Alat Terapi',
    stok: 8,
    kondisi: 'Stok Menipis',
    deskripsi: 'Perangkat aerosol untuk mengubah obat cair menjadi uap inhalasi terapi pernapasan.',
    kode_alat: 'ALK-NEB-05',
    lokasi_lab: 'Lab Farmasi & Terapi'
  },
  {
    id: 6,
    nama_alkes: 'Kursi Roda Medis Standar',
    kategori: 'Rehabilitasi Medis',
    stok: 6,
    kondisi: 'Tersedia',
    deskripsi: 'Kursi roda lipat rangka baja tahan karat untuk mobilitas pasien rumah sakit dan kampus.',
    kode_alat: 'ALK-WCH-06',
    lokasi_lab: 'Gudang Inventaris Alkes'
  }
]

// Normalisasi data dari API (fleksibel mendukung field nama_alkes, nama, name, dll.)
const rawAlkes = computed(() => {
  if (data.value) {
    const res = data.value as any
    let list: any[] = []
    if (Array.isArray(res)) list = res
    else if (res && Array.isArray(res.data)) list = res.data
    else if (res && typeof res === 'object') list = [res]

    if (list.length > 0) {
      return list.map((item, idx) => ({
        id: item.id || idx + 1,
        nama_alkes: item.nama_alkes || item.nama_alat || item.nama || item.name || `Alat Kesehatan #${idx + 1}`,
        kategori: item.kategori || item.category || item.jenis || 'Peralatan Medis',
        stok: item.stok !== undefined ? item.stok : (item.stock !== undefined ? item.stock : 10),
        kondisi: item.kondisi || item.status || (item.stok > 0 ? 'Tersedia' : 'Habis'),
        deskripsi: item.deskripsi || item.description || item.spesifikasi || item.keterangan || 'Peralatan medis inventaris kampus.',
        kode_alat: item.kode_alat || item.kode || `ALK-00${item.id || idx + 1}`,
        lokasi_lab: item.lokasi_lab || item.lokasi || 'Laboratorium Kampus'
      }))
    }
  }
  return defaultAlkesList
})

// ==========================================
// 3. FITUR PENCARIAN (SLIDE 16 & 18)
// Case-insensitive & trim spasi tepi
// ==========================================
const kataKunci = ref('')

const listAlkes = computed(() => {
  const query = kataKunci.value.trim().toLowerCase()
  return rawAlkes.value.filter(item => {
    const matchQuery = !query || 
      item.nama_alkes.toLowerCase().includes(query) ||
      item.kategori.toLowerCase().includes(query) ||
      item.deskripsi.toLowerCase().includes(query) ||
      item.kode_alat.toLowerCase().includes(query)

    const matchKategori = kategoriFilter.value === 'Semua' || item.kategori === kategoriFilter.value

    return matchQuery && matchKategori
  })
})

// Daftar Kategori Unik
const kategoriList = computed(() => {
  const set = new Set(rawAlkes.value.map(i => i.kategori))
  return ['Semua', ...Array.from(set)]
})

// Quick Stats Metric
const totalStok = computed(() => {
  return rawAlkes.value.reduce((total, item) => total + (Number(item.stok) || 0), 0)
})

// Helper untuk icon kartu alkes yang menarik & cerah
const getAlkesIcon = (nama: string, kategori: string) => {
  const lower = nama.toLowerCase()
  if (lower.includes('tensi')) return '🩺'
  if (lower.includes('stetoskop')) return '🫀'
  if (lower.includes('oximeter') || lower.includes('oksimeter')) return '💓'
  if (lower.includes('termometer') || lower.includes('suhu')) return '🌡️'
  if (lower.includes('nebulizer') || lower.includes('inhalasi')) return '💨'
  if (lower.includes('kursi roda')) return '♿'
  if (kategori.toLowerCase().includes('terapi')) return '💊'
  if (kategori.toLowerCase().includes('rehabilitasi')) return '🚶'
  return '🔬'
}

// ==========================================
// 4. FORMULIR PEMINJAMAN ALKES (SLIDE 23)
// ==========================================
const form = ref({
  namaPeminjam: '',
  nim: '',
  programStudi: 'S1 Informatika',
  alkesDipilih: 'Tensimeter Digital Otomatis (Sphygmomanometer)',
  jumlahPinjam: 1,
  tanggalPinjam: new Date().toISOString().split('T')[0],
  keperluan: ''
})

const submitSuccess = ref(false)
const noPeminjaman = ref('')

const pilihAlkesForm = (nama: string) => {
  form.value.alkesDipilih = nama
  activeNav.value = 'pinjam'
  submitSuccess.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const kirimPeminjaman = () => {
  if (!form.value.namaPeminjam || !form.value.nim || !form.value.keperluan) {
    alert('Mohon lengkapi semua kolom formulir bertanda bintang (*).')
    return
  }
  const randomNo = Math.floor(1000 + Math.random() * 9000)
  noPeminjaman.value = `PINJAM-ALKES-${randomNo}`

  riwayatPinjam.value.unshift({
    noTracking: noPeminjaman.value,
    alkes: form.value.alkesDipilih,
    peminjam: form.value.namaPeminjam,
    nim: form.value.nim,
    jumlah: form.value.jumlahPinjam,
    tanggal: form.value.tanggalPinjam,
    status: 'Menunggu Persetujuan Kepala Lab'
  })

  submitSuccess.value = true
}

// ==========================================
// 5. LACAK STATUS PINJAM (SLIDE 07)
// ==========================================
const inputTracking = ref('')
const trackingResult = ref<any>(null)

const riwayatPinjam = ref([
  {
    noTracking: 'PINJAM-ALKES-3482',
    alkes: 'Tensimeter Digital Otomatis (Sphygmomanometer)',
    peminjam: 'Ahmad Faiz',
    nim: '20230140012',
    jumlah: 2,
    tanggal: '2026-10-14',
    status: 'Disetujui - Siap Diambil di Lab'
  },
  {
    noTracking: 'PINJAM-ALKES-2891',
    alkes: 'Stetoskop Littmann Classic III',
    peminjam: 'Nabila Putri',
    nim: '20230140045',
    jumlah: 1,
    tanggal: '2026-10-12',
    status: 'Alat Sedang Digunakan (Aktif)'
  }
])

const cekStatus = () => {
  const query = inputTracking.value.trim().toUpperCase()
  if (!query) {
    trackingResult.value = null
    return
  }
  const found = riwayatPinjam.value.find(item => item.noTracking === query)
  trackingResult.value = found || { notFound: true }
}
</script>

<template>
  <div class="alkes-app">
    <!-- TOP NAVIGATION: CLEAN & BRIGHT GLASSMORPHIC -->
    <header class="navbar">
      <div class="nav-container">
        <!-- Logo & Branding Alkes UMPKU -->
        <div class="brand">
          <div class="logo-box">
            <span class="logo-icon">🩺</span>
          </div>
          <div>
            <div class="brand-tag">Sistem Inventaris & Layanan Alkes</div>
            <h1 class="brand-name">Portal Alat Kesehatan (ALKES)</h1>
            <p class="brand-sub">Universitas Muhammadiyah PKU Surakarta • Prodi S1 Informatika</p>
          </div>
        </div>

        <!-- Connection Status Indicator & Sync -->
        <div class="nav-status">
          <div class="status-pill" :class="{ 'connected': data && !error, 'disconnected': error, 'loading': pending }">
            <span class="dot"></span>
            <span>{{ pending ? 'Menghubungkan...' : error ? 'Mode Lokal: Data Alkes Modul' : 'Terhubung ke Laravel Herd (Alkes API)' }}</span>
          </div>

          <button class="btn btn-sync" :disabled="pending" title="Sinkronkan dengan Database Backend Laravel" @click="refresh()">
            <svg :class="{ 'spin': pending }" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
            </svg>
            <span>Sync Laravel</span>
          </button>
        </div>
      </div>

      <!-- Navigation Tabs (Sesuai Modul Slide 20-21) -->
      <nav class="nav-tabs-bar">
        <div class="nav-container tabs-row">
          <button class="tab-link" :class="{ 'active': activeNav === 'katalog' }" @click="activeNav = 'katalog'">
            <span class="tab-icon">📦</span> Katalog Alat Kesehatan
          </button>
          <button class="tab-link" :class="{ 'active': activeNav === 'pinjam' }" @click="activeNav = 'pinjam'">
            <span class="tab-icon">📝</span> Formulir Peminjaman Alkes
          </button>
          <button class="tab-link" :class="{ 'active': activeNav === 'tracking' }" @click="activeNav = 'tracking'">
            <span class="tab-icon">🔍</span> Lacak Status Peminjaman
          </button>
          <button class="tab-link" :class="{ 'active': activeNav === 'api-info' }" @click="activeNav = 'api-info'">
            <span class="tab-icon">⚡</span> Konfigurasi Backend Laravel
          </button>
        </div>
      </nav>
    </header>

    <!-- MAIN VIEW -->
    <main class="main-content">
      <div class="nav-container">

        <!-- RINGKASAN STATISTIK CERAH & BERSIH (Clean Overview Cards) -->
        <section class="stat-banner">
          <div class="stat-card stat-blue">
            <div class="stat-icon-wrapper">
              <span>🔬</span>
            </div>
            <div class="stat-info">
              <div class="stat-val">{{ rawAlkes.length }}</div>
              <div class="stat-label">Total Alat Medis</div>
            </div>
          </div>

          <div class="stat-card stat-emerald">
            <div class="stat-icon-wrapper">
              <span>✨</span>
            </div>
            <div class="stat-info">
              <div class="stat-val">{{ totalStok }} Unit</div>
              <div class="stat-label">Stok Tersedia di Lab</div>
            </div>
          </div>

          <div class="stat-card stat-violet">
            <div class="stat-icon-wrapper">
              <span>📑</span>
            </div>
            <div class="stat-info">
              <div class="stat-val">{{ riwayatPinjam.length }} Data</div>
              <div class="stat-label">Pengajuan Aktif</div>
            </div>
          </div>

          <div class="stat-card stat-amber">
            <div class="stat-icon-wrapper">
              <span>🏷️</span>
            </div>
            <div class="stat-info">
              <div class="stat-val">{{ kategoriList.length - 1 }} Kategori</div>
              <div class="stat-label">Jenis Pelayanan</div>
            </div>
          </div>
        </section>

        <!-- ============================================== -->
        <!-- TAB 1: KATALOG & PENCARIAN ALKES (SLIDE 16-18) -->
        <!-- ============================================== -->
        <section v-if="activeNav === 'katalog'" class="tab-section">
          <!-- Filter & Search Toolbar: Clean & Minimalist -->
          <div class="catalog-toolbar">
            <div class="toolbar-search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <!-- Input Pencarian (Slide 16-17) -->
              <input 
                id="cari"
                v-model="kataKunci" 
                type="search" 
                placeholder="Cari nama alat kesehatan (contoh: tensi, stetoskop, oksimeter, nebulizer)..." 
              />
              <button v-if="kataKunci" class="clear-icon" title="Hapus pencarian" @click="kataKunci = ''">✕</button>
            </div>

            <!-- Kategori Chips Filter -->
            <div class="kategori-chips-wrapper">
              <span class="chips-title">Kategori:</span>
              <div class="kategori-chips">
                <button 
                  v-for="kat in kategoriList" 
                  :key="kat" 
                  class="chip-btn" 
                  :class="{ 'chip-active': kategoriFilter === kat }"
                  @click="kategoriFilter = kat"
                >
                  {{ kat }}
                </button>
              </div>
            </div>

            <!-- Search Counter (Slide 18) -->
            <div class="toolbar-meta">
              <span class="meta-count">
                Menampilkan <strong>{{ listAlkes.length }}</strong> dari total {{ rawAlkes.length }} Alat Kesehatan
              </span>
              <span v-if="kataKunci" class="search-hint">Filter aktif: "{{ kataKunci.trim() }}"</span>
            </div>
          </div>

          <!-- KONDISI ANTARMUKA (SLIDE 22) -->
          <!-- 1. Kondisi Memuat -->
          <div v-if="pending && !data" class="state-loading">
            <div class="spinner-circle"></div>
            <p>Mengambil data inventaris Alkes dari Laravel API...</p>
          </div>

          <!-- 2. Kondisi Kosong (Slide 17 & 22) -->
          <div v-else-if="listAlkes.length === 0" class="state-empty">
            <div class="empty-emoji">🔍</div>
            <h3>Alat Kesehatan Tidak Ditemukan</h3>
            <p>Tidak ada alat kesehatan yang cocok dengan pencarian <strong>"{{ kataKunci }}"</strong>. Coba periksa kata kunci atau reset filter kategori.</p>
            <button class="btn btn-primary" @click="kataKunci = ''; kategoriFilter = 'Semua'">Reset Pencarian</button>
          </div>

          <!-- 3. Kondisi Berhasil: Grid Kartu Alkes Yang Segar & Cerah (Slide 18) -->
          <div v-else class="alkes-grid">
            <article v-for="item in listAlkes" :key="item.id" class="alkes-card">
              <!-- Header Kartu -->
              <div class="card-head">
                <div class="card-avatar">
                  {{ getAlkesIcon(item.nama_alkes, item.kategori) }}
                </div>
                <div class="card-badges">
                  <span class="code-badge">{{ item.kode_alat }}</span>
                  <span class="status-badge" :class="{ 'status-ready': item.kondisi.includes('Tersedia'), 'status-warn': !item.kondisi.includes('Tersedia') }">
                    <span class="badge-dot"></span>
                    {{ item.kondisi }}
                  </span>
                </div>
              </div>

              <!-- Judul & Kategori -->
              <h2 class="alkes-name">{{ item.nama_alkes }}</h2>
              <div class="alkes-category-pill">
                {{ item.kategori }}
              </div>

              <p class="alkes-desc">{{ item.deskripsi }}</p>

              <!-- Box Informasi Stok & Lokasi Bersih -->
              <div class="alkes-meta-box">
                <div class="meta-item">
                  <span class="meta-label">Stok Tersedia</span>
                  <span class="meta-val font-mono">{{ item.stok }} Unit</span>
                </div>
                <div class="meta-item-divider"></div>
                <div class="meta-item">
                  <span class="meta-label">Lokasi Lab</span>
                  <span class="meta-val" :title="item.lokasi_lab">{{ item.lokasi_lab }}</span>
                </div>
              </div>

              <!-- Tombol Aksi Cerah -->
              <div class="card-action">
                <button class="btn btn-pinjam" @click="pilihAlkesForm(item.nama_alkes)">
                  <span>Pinjam Alat Ini</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </article>
          </div>
        </section>

        <!-- ============================================== -->
        <!-- TAB 2: FORMULIR PEMINJAMAN ALKES (SLIDE 23)    -->
        <!-- ============================================== -->
        <section v-if="activeNav === 'pinjam'" class="tab-section">
          <div class="form-wrapper">
            <div class="form-title-bar">
              <div class="form-icon-header">📋</div>
              <div>
                <h2>Formulir Peminjaman Alat Kesehatan</h2>
                <p>Silakan isi data mahasiswa dan tujuan praktikum dengan jelas dan benar.</p>
              </div>
            </div>

            <!-- Notifikasi Berhasil -->
            <div v-if="submitSuccess" class="alert-success-box">
              <div class="success-icon-badge">✓</div>
              <h3>Pengajuan Peminjaman Berhasil Dikirim!</h3>
              <p>Nomor Pelacakan Resmi Peminjaman Anda:</p>
              <div class="tracking-number-box">{{ noPeminjaman }}</div>
              <p class="sub-hint">Simpan atau gunakan nomor ini di tab <strong>"Lacak Status Peminjaman"</strong> untuk memantau status persetujuan Kepala Lab.</p>
              <div class="success-btns">
                <button class="btn btn-primary" @click="activeNav = 'tracking'; inputTracking = noPeminjaman; cekStatus()">
                  🔍 Lacak Status Sekarang
                </button>
                <button class="btn btn-secondary" @click="submitSuccess = false">
                  ➕ Buat Pengajuan Lain
                </button>
              </div>
            </div>

            <!-- Form Body -->
            <form v-else class="form-body" @submit.prevent="kirimPeminjaman">
              <div class="form-grid-2">
                <div class="input-col">
                  <label for="nama">Nama Lengkap Mahasiswa *</label>
                  <input id="nama" v-model="form.namaPeminjam" type="text" placeholder="Masukkan nama peminjam..." required />
                </div>
                <div class="input-col">
                  <label for="nim">NIM Mahasiswa *</label>
                  <input id="nim" v-model="form.nim" type="text" placeholder="Contoh: 20230140021" required />
                </div>
              </div>

              <div class="form-grid-2">
                <div class="input-col">
                  <label for="prodi">Program Studi *</label>
                  <select id="prodi" v-model="form.programStudi">
                    <option value="S1 Informatika">S1 Informatika</option>
                    <option value="S1 Keperawatan">S1 Keperawatan</option>
                    <option value="S1 Kebidanan">S1 Kebidanan</option>
                    <option value="D3 Farmasi">D3 Farmasi</option>
                  </select>
                </div>
                <div class="input-col">
                  <label for="alat">Pilih Alat Kesehatan (Alkes) *</label>
                  <select id="alat" v-model="form.alkesDipilih">
                    <option v-for="item in rawAlkes" :key="item.id" :value="item.nama_alkes">
                      {{ item.nama_alkes }} (Tersedia: {{ item.stok }} Unit)
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="input-col">
                  <label for="jumlah">Jumlah Unit yang Dipinjam *</label>
                  <input id="jumlah" v-model.number="form.jumlahPinjam" type="number" min="1" max="5" required />
                </div>
                <div class="input-col">
                  <label for="tgl">Tanggal Penggunaan / Praktikum *</label>
                  <input id="tgl" v-model="form.tanggalPinjam" type="date" required />
                </div>
              </div>

              <div class="input-col">
                <label for="keperluan">Tujuan / Keperluan Praktikum *</label>
                <textarea 
                  id="keperluan" 
                  v-model="form.keperluan" 
                  rows="3" 
                  placeholder="Jelaskan kebutuhan praktikum, nama mata kuliah, atau kegiatan..." 
                  required
                ></textarea>
              </div>

              <!-- Ringkasan Validasi (Slide 23) -->
              <div class="summary-card">
                <div class="summary-header">
                  <span class="summary-badge">Ringkasan Pengajuan</span>
                  <span class="summary-sub">Periksa kembali data sebelum mengirim formulir</span>
                </div>
                <div class="summary-details">
                  <div class="summary-item">
                    <span class="summary-lbl">Alat Dipilih:</span>
                    <strong class="summary-val text-primary">{{ form.alkesDipilih }}</strong>
                  </div>
                  <div class="summary-item">
                    <span class="summary-lbl">Jumlah:</span>
                    <strong class="summary-val">{{ form.jumlahPinjam }} Unit</strong>
                  </div>
                  <div class="summary-item">
                    <span class="summary-lbl">Peminjam:</span>
                    <strong class="summary-val">{{ form.namaPeminjam || '-' }} ({{ form.nim || '-' }})</strong>
                  </div>
                  <div class="summary-item">
                    <span class="summary-lbl">Tgl Praktikum:</span>
                    <strong class="summary-val">{{ form.tanggalPinjam }}</strong>
                  </div>
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-submit-full">
                <span>Kirim Pengajuan Peminjaman Alkes</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </section>

        <!-- ============================================== -->
        <!-- TAB 3: LACAK STATUS (SLIDE 07)                 -->
        <!-- ============================================== -->
        <section v-if="activeNav === 'tracking'" class="tab-section">
          <div class="tracking-panel">
            <div class="panel-header-clean">
              <h2>Lacak Status Peminjaman Alkes</h2>
              <p>Masukkan Nomor Pelacakan Anda untuk mengetahui status verifikasi & persetujuan peminjaman alat.</p>
            </div>

            <div class="search-tracking-row">
              <div class="search-input-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  v-model="inputTracking" 
                  type="text" 
                  placeholder="Contoh: PINJAM-ALKES-3482" 
                  @keyup.enter="cekStatus" 
                />
              </div>
              <button class="btn btn-primary" @click="cekStatus">Cek Status</button>
            </div>

            <!-- Hasil Pencarian -->
            <div v-if="trackingResult && !trackingResult.notFound" class="tracking-card-result">
              <div class="result-header">
                <div>
                  <span class="track-code">{{ trackingResult.noTracking }}</span>
                  <h3 class="track-item-title">{{ trackingResult.alkes }}</h3>
                </div>
                <span class="badge-status-glow">{{ trackingResult.status }}</span>
              </div>
              <div class="result-body-grid">
                <div class="result-item">
                  <span class="res-lbl">Nama Peminjam</span>
                  <strong class="res-val">{{ trackingResult.peminjam }}</strong>
                </div>
                <div class="result-item">
                  <span class="res-lbl">NIM Mahasiswa</span>
                  <strong class="res-val font-mono">{{ trackingResult.nim }}</strong>
                </div>
                <div class="result-item">
                  <span class="res-lbl">Jumlah Unit</span>
                  <strong class="res-val">{{ trackingResult.jumlah }} Unit</strong>
                </div>
                <div class="result-item">
                  <span class="res-lbl">Tanggal Penggunaan</span>
                  <strong class="res-val">{{ trackingResult.tanggal }}</strong>
                </div>
              </div>
            </div>

            <div v-if="trackingResult && trackingResult.notFound" class="alert-not-found">
              <span class="alert-icon">⚠️</span>
              <div>
                <strong>Nomor pelacakan tidak ditemukan</strong>
                <p>Nomor "{{ inputTracking }}" tidak terdaftar dalam sistem peminjaman Alkes. Pastikan penulisan sesuai dengan bukti pengajuan.</p>
              </div>
            </div>

            <!-- Tabel Riwayat Peminjaman Bersih & Terang -->
            <div class="history-block">
              <div class="history-title-row">
                <h3>Riwayat Peminjaman Alat Terbaru</h3>
                <span class="badge-counter">{{ riwayatPinjam.length }} Pengajuan</span>
              </div>
              <div class="table-responsive">
                <table class="table-clean">
                  <thead>
                    <tr>
                      <th>No. Tracking</th>
                      <th>Alat Kesehatan</th>
                      <th>Peminjam</th>
                      <th>Jumlah</th>
                      <th>Tanggal</th>
                      <th>Status Pengajuan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="h in riwayatPinjam" :key="h.noTracking">
                      <td><code class="code-pill">{{ h.noTracking }}</code></td>
                      <td><strong>{{ h.alkes }}</strong></td>
                      <td>
                        <div class="peminjam-name">{{ h.peminjam }}</div>
                        <div class="peminjam-nim">{{ h.nim }}</div>
                      </td>
                      <td><span class="qty-pill">{{ h.jumlah }} unit</span></td>
                      <td class="font-date">{{ h.tanggal }}</td>
                      <td>
                        <span class="pill-badge-table" :class="{ 'status-approved': h.status.includes('Disetujui'), 'status-active': h.status.includes('Aktif') }">
                          {{ h.status }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <!-- ============================================== -->
        <!-- TAB 4: STATUS INTEGRASI LARAVEL HERD           -->
        <!-- ============================================== -->
        <section v-if="activeNav === 'api-info'" class="tab-section">
          <div class="backend-guide-card">
            <div class="panel-header-clean">
              <h2>Integrasi Backend Laravel Herd ⇄ Nuxt Frontend</h2>
              <p>Informasi koneksi dan sinkronisasi REST API endpoint alat kesehatan:</p>
            </div>

            <div class="info-metric-grid">
              <div class="metric-box box-blue">
                <span class="metric-lbl">Target URL API</span>
                <code class="metric-val text-sky">{{ fullApiUrl }}</code>
              </div>
              <div class="metric-box" :class="data && !error ? 'box-green' : 'box-amber'">
                <span class="metric-lbl">Status Koneksi API</span>
                <span class="metric-val" :class="data && !error ? 'text-emerald' : 'text-amber'">
                  {{ data && !error ? '● 200 OK (Terhubung Herd)' : '● Menggunakan Data Lokal Modul' }}
                </span>
              </div>
              <div class="metric-box box-indigo">
                <span class="metric-lbl">Frontend Origin</span>
                <span class="metric-val text-indigo">http://localhost:3000</span>
              </div>
            </div>

            <div class="laravel-code-guide">
              <div class="guide-header">
                <h3>Contoh Kode Route Laravel Herd (<code>routes/api.php</code>):</h3>
                <span class="lang-tag">PHP / Laravel</span>
              </div>
              <pre><code>use App\Models\Alkes; // Model Alkes di Laravel

// Route endpoint /alkes
Route::get('/alkes', function () {
    return response()->json([
        'status'  => 'success',
        'message' => 'Data Alkes berhasil diambil dari Laravel Herd',
        'data'    => Alkes::all() // Mengambil seluruh data Alkes dari MySQL
    ]);
});

// Route alias /data
Route::get('/data', function () {
    return response()->json([
        'status'  => 'success',
        'message' => 'Data Alkes berhasil diambil dari Laravel Herd',
        'data'    => Alkes::all()
    ]);
});</code></pre>

              <div class="guide-header" style="margin-top: 1.5rem;">
                <h3>Pengaturan CORS di <code>config/cors.php</code>:</h3>
                <span class="lang-tag">Config</span>
              </div>
              <pre><code>'allowed_origins' => ['http://localhost:3000'],</code></pre>
            </div>
          </div>
        </section>

      </div>
    </main>

    <!-- FOOTER KAMPUS BERSIH & ELEGAN -->
    <footer class="app-footer">
      <div class="nav-container footer-flex">
        <div class="footer-brand">
          <span class="footer-icon">🩺</span>
          <strong>Portal Inventaris Alat Kesehatan (ALKES)</strong>
        </div>
        <p class="footer-sub">Universitas Muhammadiyah PKU Surakarta • Program Studi S1 Informatika</p>
        <p class="footer-tech">Antarmuka Modern, Bersih, dan Cerah • Terintegrasi Nuxt 4 & Laravel Herd REST API</p>
      </div>
    </footer>
  </div>
</template>

<style>
/* ========================================================
   DESIGN SYSTEM: CERAH, SEGAR, BERSIH & TIDAK RAME
   ======================================================== */
:root {
  --bg-page: #F8FAFC;
  --bg-surface: #FFFFFF;
  --border-light: #E2E8F0;
  --border-focus: #0EA5E9;
  
  --text-main: #0F172A;
  --text-body: #334155;
  --text-muted: #64748B;
  --text-subtle: #94A3B8;

  --primary: #0284C7;
  --primary-hover: #0369A1;
  --primary-light: #E0F2FE;
  
  --emerald: #059669;
  --emerald-light: #ECFDF5;
  
  --amber: #D97706;
  --amber-light: #FEF3C7;
  
  --violet: #6366F1;
  --violet-light: #EEF2FF;
  
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.05);
  --shadow-card: 0 4px 18px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.02);
  --shadow-hover: 0 12px 28px -4px rgba(15, 23, 42, 0.1), 0 4px 8px -2px rgba(15, 23, 42, 0.03);
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-page);
  /* Atmospheric cheerful soft ambient glow */
  background-image: 
    radial-gradient(at 0% 0%, rgba(224, 242, 254, 0.6) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(236, 253, 245, 0.6) 0px, transparent 50%),
    radial-gradient(at 50% 100%, rgba(238, 242, 255, 0.4) 0px, transparent 60%);
  background-attachment: fixed;
  color: var(--text-body);
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

code, pre, .font-mono {
  font-family: 'JetBrains Mono', monospace;
}

.alkes-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav-container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 1.5rem;
  width: 100%;
}

/* ========================================================
   NAVBAR: BERSIH, TERANG & MODERN (GLASSMORPHIC)
   ======================================================== */
.navbar {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-light);
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.03);
}

.navbar .nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  padding-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-box {
  background: linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%);
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25);
  flex-shrink: 0;
}

.brand-tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.brand-name {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.brand-sub {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.nav-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #F1F5F9;
  border: 1px solid var(--border-light);
  color: var(--text-muted);
}

.status-pill .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-subtle);
}

.status-pill.connected {
  background: var(--emerald-light);
  border-color: #A7F3D0;
  color: var(--emerald);
}
.status-pill.connected .dot {
  background: #10B981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
}

.status-pill.disconnected {
  background: var(--amber-light);
  border-color: #FDE68A;
  color: var(--amber);
}
.status-pill.disconnected .dot {
  background: #F59E0B;
}

.btn-sync {
  background: var(--bg-surface);
  color: var(--text-body);
  border: 1px solid var(--border-light);
  padding: 0.45rem 0.95rem;
  border-radius: 10px;
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}
.btn-sync:hover:not(:disabled) {
  background: #F8FAFC;
  border-color: #CBD5E1;
  color: var(--primary);
  transform: translateY(-1px);
}

.spin {
  animation: rotate 1s linear infinite;
}
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ========================================================
   NAV TABS BAR: FLOATING PILL TABS
   ======================================================== */
.nav-tabs-bar {
  background: rgba(248, 250, 252, 0.7);
  border-top: 1px solid #EDF2F7;
  padding: 0.35rem 0;
}

.tabs-row {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs-row::-webkit-scrollbar {
  display: none;
}

.tab-link {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 0.65rem 1.1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 9999px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  transition: all 0.2s ease;
}

.tab-icon {
  font-size: 1rem;
}

.tab-link:hover {
  color: var(--text-main);
  background: rgba(226, 232, 240, 0.5);
}

.tab-link.active {
  color: var(--primary);
  background: var(--primary-light);
  font-weight: 700;
}

/* ========================================================
   MAIN CONTENT & STATS BANNER
   ======================================================== */
.main-content {
  flex: 1;
  padding: 2rem 0;
}

.stat-banner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 1.15rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow-card);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.stat-icon-wrapper {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.stat-blue .stat-icon-wrapper {
  background: #E0F2FE;
  color: #0284C7;
}
.stat-emerald .stat-icon-wrapper {
  background: #DCFCE7;
  color: #10B981;
}
.stat-violet .stat-icon-wrapper {
  background: #EEF2FF;
  color: #6366F1;
}
.stat-amber .stat-icon-wrapper {
  background: #FEF3C7;
  color: #F59E0B;
}

.stat-val {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* ========================================================
   CATALOG TOOLBAR (SEARCH & CATEGORIES)
   ======================================================== */
.catalog-toolbar {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: 18px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-card);
}

.toolbar-search {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 1.25rem;
}

.toolbar-search svg {
  position: absolute;
  left: 1.15rem;
  color: var(--text-subtle);
  pointer-events: none;
}

.toolbar-search input {
  width: 100%;
  background: #F8FAFC;
  border: 1.5px solid var(--border-light);
  color: var(--text-main);
  padding: 0.85rem 2.8rem 0.85rem 3.2rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
}
.toolbar-search input:focus {
  background: #FFFFFF;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.12);
}
.toolbar-search input::placeholder {
  color: var(--text-subtle);
}

.clear-icon {
  position: absolute;
  right: 1.15rem;
  background: #E2E8F0;
  border: none;
  color: var(--text-muted);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.15s ease;
}
.clear-icon:hover {
  background: #CBD5E1;
  color: var(--text-main);
}

.kategori-chips-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.15rem;
  flex-wrap: wrap;
}

.chips-title {
  font-size: 0.825rem;
  font-weight: 700;
  color: var(--text-muted);
}

.kategori-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip-btn {
  background: #F1F5F9;
  border: 1px solid var(--border-light);
  color: var(--text-body);
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  font-size: 0.825rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
}

.chip-btn:hover {
  background: #E2E8F0;
  color: var(--text-main);
  border-color: #CBD5E1;
}

.chip-btn.chip-active {
  background: linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%);
  color: #FFFFFF;
  border-color: #0284C7;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.25);
}

.toolbar-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.825rem;
  color: var(--text-muted);
  border-top: 1px solid #EDF2F7;
  padding-top: 0.85rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-count strong {
  color: var(--text-main);
}

.search-hint {
  color: var(--primary);
  font-weight: 600;
  background: var(--primary-light);
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
}

/* ========================================================
   ALKES GRID & CARDS: ENJIK, BERSIH & CERAH
   ======================================================== */
.alkes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 1.5rem;
}

.alkes-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: 18px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-card);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.alkes-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  border-color: #CBD5E1;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #E0F2FE 0%, #F0FDF4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
  border: 1px solid #E0F2FE;
}

.card-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

.code-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.725rem;
  background: #F1F5F9;
  color: var(--text-muted);
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  font-weight: 600;
  border: 1px solid #E2E8F0;
}

.status-badge {
  font-size: 0.725rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-ready {
  background: var(--emerald-light);
  color: var(--emerald);
  border: 1px solid #A7F3D0;
}

.status-warn {
  background: var(--amber-light);
  color: var(--amber);
  border: 1px solid #FDE68A;
}

.alkes-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.4rem;
  line-height: 1.35;
}

.alkes-category-pill {
  display: inline-block;
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 700;
  color: #0369A1;
  background: var(--primary-light);
  padding: 0.2rem 0.65rem;
  border-radius: 6px;
  margin-bottom: 0.85rem;
}

.alkes-desc {
  font-size: 0.875rem;
  color: var(--text-body);
  margin-bottom: 1.25rem;
  line-height: 1.55;
  flex: 1;
}

.alkes-meta-box {
  background: #F8FAFC;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 0.85rem 1rem;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.meta-item-divider {
  width: 1px;
  height: 30px;
  background: var(--border-light);
}

.meta-label {
  font-size: 0.72rem;
  color: var(--text-subtle);
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.meta-val {
  color: var(--text-main);
  font-weight: 700;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 155px;
}

.card-action {
  margin-top: auto;
}

.btn-pinjam {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  background: #F1F5F9;
  color: var(--primary);
  border: 1px solid #CBD5E1;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-pinjam:hover {
  background: linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%);
  color: #FFFFFF;
  border-color: #0284C7;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
  transform: translateY(-1px);
}

/* ========================================================
   GLOBAL BUTTONS
   ======================================================== */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%);
  color: #FFFFFF;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25);
}
.btn-primary:hover {
  background: linear-gradient(135deg, #0369A1 0%, #0284C7 100%);
  box-shadow: 0 6px 18px rgba(2, 132, 199, 0.35);
  transform: translateY(-1px);
}

.btn-secondary {
  background: #F1F5F9;
  color: var(--text-body);
  border: 1px solid var(--border-light);
}
.btn-secondary:hover {
  background: #E2E8F0;
  color: var(--text-main);
}

/* ========================================================
   FORMULIR PEMINJAMAN ALKES: ELEGAN, BERSIH & RAPI
   ======================================================== */
.form-wrapper {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: 20px;
  padding: 2.25rem;
  max-width: 820px;
  margin: 0 auto;
  box-shadow: var(--shadow-card);
}

.form-title-bar {
  display: flex;
  align-items: center;
  gap: 1.15rem;
  border-bottom: 1px solid #EDF2F7;
  padding-bottom: 1.25rem;
  margin-bottom: 1.75rem;
}

.form-icon-header {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #E0F2FE;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  color: #0284C7;
  flex-shrink: 0;
}

.form-title-bar h2 {
  font-size: 1.4rem;
  color: var(--text-main);
  font-weight: 800;
  margin-bottom: 0.2rem;
}
.form-title-bar p {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.input-col {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.input-col label {
  font-size: 0.825rem;
  font-weight: 700;
  color: var(--text-main);
}

.input-col input,
.input-col select,
.input-col textarea {
  background: #F8FAFC;
  border: 1.5px solid var(--border-light);
  color: var(--text-main);
  padding: 0.75rem 0.95rem;
  border-radius: 12px;
  font-size: 0.925rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
}
.input-col input:focus,
.input-col select:focus,
.input-col textarea:focus {
  background: #FFFFFF;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.12);
}

.summary-card {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 1.25rem;
  border-left: 4px solid var(--primary);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.summary-badge {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.summary-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.summary-lbl {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.summary-val {
  color: var(--text-main);
}

.text-primary {
  color: var(--primary);
}

.btn-submit-full {
  width: 100%;
  justify-content: center;
  padding: 0.9rem;
  margin-top: 0.5rem;
  font-size: 1rem;
}

/* SUCCESS BANNER */
.alert-success-box {
  background: #F0FDF4;
  border: 1.5px solid #86EFAC;
  border-radius: 18px;
  padding: 2.5rem 2rem;
  text-align: center;
}

.success-icon-badge {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #10B981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0 auto 1.25rem;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.alert-success-box h3 {
  font-size: 1.4rem;
  color: #065F46;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.tracking-number-box {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.8rem;
  font-weight: 800;
  color: #047857;
  background: #FFFFFF;
  display: inline-block;
  padding: 0.65rem 1.75rem;
  border-radius: 12px;
  border: 2px dashed #34D399;
  margin: 1.25rem 0;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
}

.sub-hint {
  font-size: 0.875rem;
  color: var(--text-muted);
  max-width: 500px;
  margin: 0 auto;
}

.success-btns {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.75rem;
  flex-wrap: wrap;
}

/* ========================================================
   TRACKING TAB & CLEAN TABLE
   ======================================================== */
.tracking-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: 20px;
  padding: 2.25rem;
  box-shadow: var(--shadow-card);
}

.panel-header-clean {
  margin-bottom: 1.5rem;
}
.panel-header-clean h2 {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 0.25rem;
}
.panel-header-clean p {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.search-tracking-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.75rem;
}

.search-input-box {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-box svg {
  position: absolute;
  left: 1rem;
  color: var(--text-subtle);
  pointer-events: none;
}

.search-input-box input {
  width: 100%;
  background: #F8FAFC;
  border: 1.5px solid var(--border-light);
  color: var(--text-main);
  padding: 0.85rem 1rem 0.85rem 2.8rem;
  border-radius: 12px;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s ease;
}
.search-input-box input:focus {
  background: #FFFFFF;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.12);
}

.tracking-card-result {
  background: #F0F9FF;
  border: 1.5px solid #BAE6FD;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #E0F2FE;
  padding-bottom: 0.85rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.track-code {
  font-family: 'JetBrains Mono', monospace;
  color: var(--primary);
  font-size: 0.8rem;
  font-weight: 700;
  display: block;
}

.track-item-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-main);
}

.badge-status-glow {
  background: #E0F2FE;
  color: #0369A1;
  border: 1px solid #7DD3FC;
  padding: 0.4rem 0.95rem;
  border-radius: 9999px;
  font-size: 0.825rem;
  font-weight: 700;
}

.result-body-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  font-size: 0.875rem;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.res-lbl {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.res-val {
  color: var(--text-main);
}

.alert-not-found {
  background: #FFF1F2;
  border: 1px solid #FECDD3;
  color: #9F1239;
  padding: 1.15rem 1.35rem;
  border-radius: 14px;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.alert-icon {
  font-size: 1.5rem;
}
.alert-not-found p {
  font-size: 0.85rem;
  color: #BE123C;
  margin-top: 0.15rem;
}

.history-block {
  margin-top: 2rem;
}

.history-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.history-title-row h3 {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-main);
}

.badge-counter {
  background: #F1F5F9;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
}

.table-responsive {
  overflow-x: auto;
  border: 1px solid var(--border-light);
  border-radius: 14px;
  background: var(--bg-surface);
}

.table-clean {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  text-align: left;
}

.table-clean th {
  background: #F8FAFC;
  color: var(--text-muted);
  padding: 0.85rem 1.15rem;
  font-weight: 700;
  border-bottom: 1px solid var(--border-light);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.table-clean td {
  padding: 0.95rem 1.15rem;
  border-bottom: 1px solid #F1F5F9;
  color: var(--text-body);
}

.table-clean tr:last-child td {
  border-bottom: none;
}

.table-clean tr:hover td {
  background: #F8FAFC;
}

.code-pill {
  font-family: 'JetBrains Mono', monospace;
  background: #F1F5F9;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.775rem;
  color: var(--text-main);
  border: 1px solid #E2E8F0;
  white-space: nowrap;
  display: inline-block;
}

.peminjam-name {
  font-weight: 600;
  color: var(--text-main);
}

.peminjam-nim {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
}

.qty-pill {
  font-weight: 700;
  color: var(--primary);
  background: var(--primary-light);
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  font-size: 0.8rem;
  white-space: nowrap;
  display: inline-block;
}

.font-date {
  font-size: 0.825rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.pill-badge-table {
  display: inline-block;
  background: #F1F5F9;
  color: var(--text-muted);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.775rem;
  font-weight: 600;
  white-space: nowrap;
}

.pill-badge-table.status-approved {
  background: var(--emerald-light);
  color: var(--emerald);
  border: 1px solid #A7F3D0;
}

.pill-badge-table.status-active {
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid #BAE6FD;
}

/* ========================================================
   BACKEND GUIDE TAB: BERSIH & JELAS
   ======================================================== */
.backend-guide-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: 20px;
  padding: 2.25rem;
  box-shadow: var(--shadow-card);
}

.info-metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  margin: 1.75rem 0;
}

.metric-box {
  padding: 1.15rem 1.25rem;
  border-radius: 14px;
  border: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.box-blue {
  background: #F0F9FF;
  border-color: #BAE6FD;
}
.box-green {
  background: #F0FDF4;
  border-color: #BBF7D0;
}
.box-amber {
  background: #FFFBEB;
  border-color: #FDE68A;
}
.box-indigo {
  background: #EEF2FF;
  border-color: #C7D2FE;
}

.metric-lbl {
  display: block;
  font-size: 0.725rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.metric-val {
  font-weight: 700;
  font-size: 0.95rem;
}

.text-sky { color: #0284C7; }
.text-emerald { color: #059669; }
.text-amber { color: #D97706; }
.text-indigo { color: #4F46E5; }

.laravel-code-guide {
  margin-top: 2rem;
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.65rem;
}

.guide-header h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
}

.lang-tag {
  font-size: 0.7rem;
  font-weight: 700;
  background: #F1F5F9;
  color: var(--text-muted);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  text-transform: uppercase;
}

.laravel-code-guide pre {
  background: #0F172A;
  padding: 1.15rem 1.25rem;
  border-radius: 12px;
  color: #E2E8F0;
  font-size: 0.825rem;
  overflow-x: auto;
  line-height: 1.6;
}

/* ========================================================
   EMPTY & LOADING STATES
   ======================================================== */
.state-empty {
  background: var(--bg-surface);
  border: 2px dashed var(--border-light);
  border-radius: 18px;
  padding: 3.5rem 1.5rem;
  text-align: center;
  margin-top: 1rem;
}

.empty-emoji {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.state-empty h3 {
  font-size: 1.3rem;
  color: var(--text-main);
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.state-empty p {
  color: var(--text-muted);
  font-size: 0.9rem;
  max-width: 480px;
  margin: 0 auto 1.5rem;
}

.state-loading {
  text-align: center;
  padding: 4.5rem 1rem;
  color: var(--text-muted);
}

.spinner-circle {
  width: 42px;
  height: 42px;
  border: 3.5px solid #E2E8F0;
  border-top-color: var(--primary);
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: rotate 0.8s linear infinite;
}

/* ========================================================
   FOOTER: BERSIH & PROFESIONAL
   ======================================================== */
.app-footer {
  background: var(--bg-surface);
  border-top: 1px solid var(--border-light);
  padding: 2.25rem 0;
  margin-top: auto;
}

.footer-flex {
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-body);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.footer-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: var(--text-main);
}

.footer-icon {
  font-size: 1.1rem;
}

.footer-sub {
  color: var(--text-muted);
  font-size: 0.825rem;
}

.footer-tech {
  font-size: 0.75rem;
  color: var(--text-subtle);
  margin-top: 0.25rem;
}

/* ========================================================
   RESPONSIVE DESIGN
   ======================================================== */
@media (max-width: 900px) {
  .stat-banner {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .form-grid-2 {
    grid-template-columns: 1fr;
  }
  .info-metric-grid {
    grid-template-columns: 1fr;
  }
  .result-body-grid {
    grid-template-columns: 1fr 1fr;
  }
  .stat-banner {
    grid-template-columns: 1fr;
  }
  .navbar .nav-container {
    flex-direction: column;
    align-items: flex-start;
  }
  .nav-status {
    width: 100%;
    justify-content: space-between;
  }
  .summary-details {
    grid-template-columns: 1fr;
  }
}
</style>
