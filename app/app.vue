<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { masterAlkesCollection, type AlkesItem } from './data/alkesData'
import { blogArticles, type BlogArticle } from './data/blogData'
import '~/assets/css/main.css'

// ============================================================================
// 1. TEMA & MODE GELAP / TERANG (DEFAULT: TEMA TERANG MINT & BIRU)
// ============================================================================
const isDark = ref(false)

const applyTheme = (dark: boolean) => {
  if (typeof document !== 'undefined') {
    if (dark) {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
      localStorage.setItem('anisa_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
      localStorage.setItem('anisa_theme', 'light')
    }
  }
}

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('anisa_theme')
    if (saved === 'dark') {
      isDark.value = true
      applyTheme(true)
    } else {
      isDark.value = false
      applyTheme(false)
    }
  }
})

// ============================================================================
// 2. NAVIGASI TAMPILAN HALAMAN (PORTAL, BLOG, INVENTARIS)
// ============================================================================
type ViewPage = 'portal' | 'blog' | 'inventaris'
const currentView = ref<ViewPage>('portal')
const isMobileMenuOpen = ref(false)

// Pengamanan Area Backend Khusus Admin Inventaris
const isAdminAuthenticated = ref(false)
const isAdminLoginModalOpen = ref(false)
const adminPinInput = ref('')
const adminPinError = ref('')

const bukaAksesAdmin = () => {
  if (isAdminAuthenticated.value) {
    currentView.value = 'inventaris'
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } else {
    adminPinInput.value = ''
    adminPinError.value = ''
    isAdminLoginModalOpen.value = true
  }
}

const verifikasiAdmin = () => {
  const pin = adminPinInput.value.trim()
  if (pin === '1234' || pin === 'admin' || pin === 'admin123') {
    isAdminAuthenticated.value = true
    isAdminLoginModalOpen.value = false
    currentView.value = 'inventaris'
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    toast.add({
      title: 'Akses Admin Terverifikasi',
      description: 'Selamat datang di area backend pengelolaan inventaris alkes.',
      color: 'success'
    })
  } else {
    adminPinError.value = 'PIN tidak sesuai. Masukkan PIN Admin: 1234'
  }
}

const logoutAdmin = () => {
  isAdminAuthenticated.value = false
  currentView.value = 'portal'
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  toast.add({
    title: 'Sesi Admin Ditutup',
    description: 'Anda telah kembali ke halaman publik pelanggan.',
    color: 'info'
  })
}

const setView = (page: ViewPage, targetSection?: string) => {
  if (page === 'inventaris' && !isAdminAuthenticated.value) {
    bukaAksesAdmin()
    return
  }
  currentView.value = page
  isMobileMenuOpen.value = false
  if (targetSection && typeof document !== 'undefined') {
    setTimeout(() => {
      const el = document.getElementById(targetSection)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  } else if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// ============================================================================
// 3. SAFE IMAGE FALLBACK HANDLER
// Menjamin foto lokal maupun placeholder cadangan selalu tampil aman tanpa error
// ============================================================================
const handleImgError = (event: Event, fallbackUrl?: string) => {
  const target = event.target as HTMLImageElement
  const fallback = fallbackUrl || 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=80'
  if (target && target.src !== fallback) {
    target.src = fallback
  }
}

// ============================================================================
// 4. INTEGRASI DATA REAKTIF & API LARAVEL (DENGAN MASTER FALLBACK)
// ============================================================================
const config = useRuntimeConfig()
const API_BASE_URL = config.public.apiBase || 'http://127.0.0.1:8000/alat'

// Resilient Toast Notification system
interface ToastNotification {
  id: number
  title: string
  description?: string
  color?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
}
const activeToasts = ref<ToastNotification[]>([])
const addToast = (t: { title: string; description?: string; color?: string }) => {
  const id = Date.now() + Math.random()
  activeToasts.value.push({ id, title: t.title, description: t.description, color: (t.color as any) || 'info' })
  setTimeout(() => {
    activeToasts.value = activeToasts.value.filter(item => item.id !== id)
  }, 4000)
}
const toast = { add: addToast }

const { data: apiResponse, pending: isLoadingApi, error: apiError, refresh } = await useFetch(API_BASE_URL, {
  lazy: false,
  server: false,
  key: 'anisa-alkes-fetch',
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

const localAlkesList = ref<AlkesItem[]>([...masterAlkesCollection])

const normalizeApiData = (res: any): AlkesItem[] => {
  let list: any[] = []
  if (Array.isArray(res)) {
    list = res
  } else if (res && Array.isArray(res.data)) {
    list = res.data
  } else if (res && typeof res === 'object' && res.data) {
    list = Array.isArray(res.data) ? res.data : [res.data]
  }

  if (list && list.length > 0) {
    return list.map((item, idx) => {
      const fallbackMatch = masterAlkesCollection[idx % masterAlkesCollection.length]
      const nama = item.nama_alat || item.nama_alkes || item.nama || item.name || fallbackMatch.nama_alat
      return {
        id: item.id || idx + 1,
        kode_alat: item.kode_alat || item.kode || `ALK-00${item.id || idx + 1}`,
        nama_alat: nama,
        nama_alkes: nama,
        kategori: item.kategori || item.category || fallbackMatch.kategori,
        stok: Number(item.stok !== undefined ? item.stok : (item.stock !== undefined ? item.stock : fallbackMatch.stok)),
        status: (item.status || item.kondisi || 'Tersedia') as any,
        lokasi_lab: item.lokasi_lab || item.lokasi || fallbackMatch.lokasi_lab,
        deskripsi: item.deskripsi || item.description || fallbackMatch.deskripsi,
        gambar: item.gambar || fallbackMatch.gambar,
        fallbackGambar: fallbackMatch.fallbackGambar || fallbackMatch.gambar,
        kemenkes_akl: fallbackMatch.kemenkes_akl,
        spesifikasi: fallbackMatch.spesifikasi,
        harga_estimasi: fallbackMatch.harga_estimasi,
        garansi: fallbackMatch.garansi,
        is_featured: fallbackMatch.is_featured
      }
    })
  }
  return masterAlkesCollection
}

watch(apiResponse, (newVal) => {
  if (newVal) {
    localAlkesList.value = normalizeApiData(newVal)
  }
}, { immediate: true })

onMounted(() => {
  if (!apiResponse.value || (Array.isArray(apiResponse.value) && apiResponse.value.length === 0)) {
    localAlkesList.value = [...masterAlkesCollection]
  }
})

const isConnectedToApi = computed(() => !apiError.value && !!apiResponse.value)

const refreshData = async () => {
  try {
    await refresh()
    toast.add({
      title: 'Sinkronisasi Berhasil',
      description: 'Data alkes berhasil disinkronisasi dari server pusat Anisa Medika.',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Koneksi Offline',
      description: 'Menampilkan katalog lokal Anisa Medika berstandar Kemenkes RI.',
      color: 'info'
    })
  }
}

// ============================================================================
// 5. GRID GALERI / KATALOG PRODUK ALKES DI BAWAH BANNER
// ============================================================================
const galleryCategory = ref('Semua')
const gallerySearch = ref('')
const gallerySort = ref<'default' | 'name' | 'stock' | 'price'>('default')

const galleryCategories = [
  'Semua',
  'Alat Diagnostik',
  'Monitoring Pasien',
  'Bedah & Gawat Darurat',
  'Rehabilitasi Medis',
  'Laboratorium & Rehab'
]

const parsePriceNumber = (priceStr?: string): number => {
  if (!priceStr) return 0
  const clean = priceStr.replace(/[^0-9]/g, '')
  return parseInt(clean, 10) || 0
}

const filteredGalleryList = computed(() => {
  const query = gallerySearch.value.trim().toLowerCase()
  let list = localAlkesList.value.filter(item => {
    const matchCategory = galleryCategory.value === 'Semua' || 
      (galleryCategory.value === 'Laboratorium & Rehab' 
        ? (item.kategori.includes('Laboratorium') || item.kategori.includes('Rehabilitasi'))
        : item.kategori.toLowerCase().includes(galleryCategory.value.toLowerCase()))

    const matchQuery = !query ||
      item.nama_alat.toLowerCase().includes(query) ||
      item.kode_alat.toLowerCase().includes(query) ||
      item.kategori.toLowerCase().includes(query) ||
      (item.deskripsi && item.deskripsi.toLowerCase().includes(query))

    return matchCategory && matchQuery
  })

  if (gallerySort.value === 'name') {
    list = [...list].sort((a, b) => a.nama_alat.localeCompare(b.nama_alat))
  } else if (gallerySort.value === 'stock') {
    list = [...list].sort((a, b) => b.stok - a.stok)
  } else if (gallerySort.value === 'price') {
    list = [...list].sort((a, b) => parsePriceNumber(b.harga_estimasi) - parsePriceNumber(a.harga_estimasi))
  }

  return list
})

// Modal Detail Spesifikasi Alat
const isDetailModalOpen = ref(false)
const selectedDetailItem = ref<AlkesItem | null>(null)

const bukaDetailAlat = (item: AlkesItem) => {
  selectedDetailItem.value = item
  isDetailModalOpen.value = true
}

// ============================================================================
// 6. HALAMAN & DATA BLOG ALKES ANISA MEDIKA
// ============================================================================
const blogCategory = ref('Semua')
const blogSearch = ref('')
const blogCategories = [
  'Semua',
  'Regulasi & Standar',
  'Teknologi Medis',
  'Manajemen Faskes',
  'Tips Pemeliharaan',
  'Kegawatdaruratan'
]

const filteredBlogList = computed(() => {
  const query = blogSearch.value.trim().toLowerCase()
  return blogArticles.filter(art => {
    const matchCat = blogCategory.value === 'Semua' || art.kategori === blogCategory.value
    const matchQuery = !query ||
      art.judul.toLowerCase().includes(query) ||
      art.ringkasan.toLowerCase().includes(query) ||
      art.penulis.nama.toLowerCase().includes(query) ||
      art.tags.some(t => t.toLowerCase().includes(query))

    return matchCat && matchQuery
  })
})

const isArticleModalOpen = ref(false)
const selectedArticle = ref<BlogArticle | null>(null)

const bukaArtikel = (article: BlogArticle) => {
  selectedArticle.value = article
  isArticleModalOpen.value = true
}

// ============================================================================
// 7. FORMULIR PENAWARAN & KONSULTASI WHATSAPP
// ============================================================================
const isQuoteModalOpen = ref(false)
const quoteForm = ref({
  nama: '',
  instansi: '',
  telepon: '',
  alatDipilih: '',
  pesan: ''
})

const bukaModalPenawaran = (namaAlat?: string) => {
  quoteForm.value.alatDipilih = namaAlat || ''
  isQuoteModalOpen.value = true
}

const kirimPenawaran = () => {
  if (!quoteForm.value.nama.trim() || !quoteForm.value.telepon.trim()) {
    toast.add({
      title: 'Data Belum Lengkap',
      description: 'Mohon isi nama lengkap dan nomor WhatsApp/telepon Anda.',
      color: 'warning'
    })
    return
  }

  const pesanWA = encodeURIComponent(
    `Halo Anisa Medika, saya ${quoteForm.value.nama} dari ${quoteForm.value.instansi || 'Fasilitas Medis'}. ` +
    `Saya tertarik meminta informasi harga & spesifikasi resmi untuk: ${quoteForm.value.alatDipilih || 'Peralatan Medis'}. ` +
    `Catatan kebutuhan: ${quoteForm.value.pesan || '-'}`
  )

  toast.add({
    title: 'Permintaan Diterima!',
    description: 'Tim konsultan spesialis Anisa Medika akan segera menghubungi Anda.',
    color: 'success'
  })

  isQuoteModalOpen.value = false

  if (typeof window !== 'undefined') {
    window.open(`https://wa.me/6281234567890?text=${pesanWA}`, '_blank')
  }
}

// ============================================================================
// 7B. INTEGRASI PEMBAYARAN MIDTRANS SNAP (SANDBOX)
// ============================================================================
useHead({
  script: [
    {
      src: 'https://app.sandbox.midtrans.com/snap/snap.js',
      'data-client-key': (config.public.midtransClientKey as string) || 'Mid-client-hwnw4ojbmqqrRRRS',
      defer: true
    }
  ]
})

const isCheckoutModalOpen = ref(false)
const checkoutItem = ref<AlkesItem | null>(null)
const checkoutQty = ref(1)
const checkoutForm = ref({
  first_name: 'Budi Santoso',
  email: 'budi.santoso@example.com',
  phone: '081234567890',
  catatan: ''
})
const isProcessingPayment = ref(false)
const paymentResult = ref<any>(null)
const isPaymentSuccessModalOpen = ref(false)
const isPaymentPendingModalOpen = ref(false)

const checkoutUnitPrice = computed(() => {
  if (!checkoutItem.value) return 500000
  const parsed = parsePriceNumber(checkoutItem.value.harga_estimasi)
  return parsed > 0 ? parsed : 500000
})

const checkoutGrossAmount = computed(() => {
  return checkoutUnitPrice.value * checkoutQty.value
})

const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0)
}

const bukaModalCheckout = (item?: AlkesItem) => {
  if (item) {
    checkoutItem.value = item
  } else if (!checkoutItem.value && localAlkesList.value.length > 0) {
    checkoutItem.value = localAlkesList.value[0]
  }
  checkoutQty.value = 1
  isCheckoutModalOpen.value = true
}

const ubahCheckoutQty = (delta: number) => {
  const next = checkoutQty.value + delta
  if (next >= 1 && next <= (checkoutItem.value?.stok || 99)) {
    checkoutQty.value = next
  }
}

// Pastikan script Midtrans Snap SDK termuat dengan tepat sesuai environment (Sandbox)
const loadMidtransSnap = (isProduction = false): Promise<any> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null)

    const expectedSrc = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'

    const clientKey = (config.public.midtransClientKey as string) || 'Mid-client-7fwVxW4j40g8TI10'

    // Bersihkan script Production jika kita berada di mode Sandbox
    let needsNewScript = false
    const existingScripts = document.querySelectorAll('script[src*="snap.js"]')
    existingScripts.forEach((s) => {
      const src = (s as HTMLScriptElement).src || ''
      if (!isProduction && !src.includes('sandbox.midtrans.com') && src.includes('midtrans.com')) {
        console.log('[Midtrans] Menghapus script Production lama dan beralih ke Sandbox')
        s.remove()
        needsNewScript = true
        delete (window as any).snap
      }
    })

    if (!needsNewScript && (window as any).snap) {
      return resolve((window as any).snap)
    }

    const script = document.createElement('script')
    script.src = expectedSrc
    script.setAttribute('data-client-key', clientKey)
    script.async = true
    script.onload = () => {
      console.log('[Midtrans Snap SDK] Berhasil dimuat dari Sandbox:', expectedSrc)
      resolve((window as any).snap)
    }
    script.onerror = () => {
      console.warn('[Midtrans] Gagal memuat script snap.js dari:', expectedSrc)
      resolve(null)
    }
    document.head.appendChild(script)
  })
}

// Alur Eksekusi Bayar Sekarang: Request Token menggunakan Server Key Sandbox -> Jalankan window.snap.pay
const prosesPembayaranMidtrans = async () => {
  const totalHarga = Number(checkoutGrossAmount.value)
  if (!totalHarga || totalHarga <= 0) {
    toast.add({
      title: 'Nominal Tidak Valid',
      description: 'Total transaksi pembayaran harus lebih besar dari Rp 0.',
      color: 'warning'
    })
    return
  }

  // Server Key Sandbox Midtrans resmi yang baru saja di-generate
  const MIDTRANS_SERVER_KEY = 'SB-Mid-server-FVYRHW4KMT1AgoyI.cfgKDnt'

  // Penyesuaian Payload Data
  const namaPelanggan = checkoutForm.value.first_name?.trim() || 'Pelanggan'
  const emailPelanggan = checkoutForm.value.email?.trim() || 'pelanggan@example.com'
  const namaAlat = checkoutItem.value?.nama_alat || checkoutItem.value?.nama || 'Alat Medis Anisa Medika'

  const payload = {
    gross_amount: Number(totalHarga),
    first_name: namaPelanggan || 'Pelanggan',
    email: emailPelanggan || 'pelanggan@example.com',
    item_name: namaAlat,
    alat_id: checkoutItem.value?.id || null,
    qty: Number(checkoutQty.value) || 1,
    server_key: MIDTRANS_SERVER_KEY
  }

  // Mulai status loading pada tombol Bayar Sekarang
  isProcessingPayment.value = true

  try {
    // Pastikan script Midtrans Snap SDK Sandbox termuat di browser
    if (typeof window !== 'undefined' && !(window as any).snap) {
      await loadMidtransSnap(false).catch(() => null)
    }

    // Endpoint pemanggil token (Nuxt proxy didahulukan karena memiliki fallback direct Midtrans Sandbox API)
    const candidateEndpoints = [
      '/api/midtrans-token',
      'http://localhost:8000/api/midtrans-token',
      'http://192.168.1.2:8000/api/midtrans-token',
      'http://127.0.0.1:8000/api/midtrans-token',
      (config.public.midtransApiUrl as string) || '',
      'http://172.16.7.19:8000/api/midtrans-token'
    ].filter(Boolean)
    const endpoints = Array.from(new Set(candidateEndpoints))

    let responseData: any = null
    let connectedEndpoint = ''
    let lastNetworkError: any = null

    for (const ep of endpoints) {
      try {
        console.log(`[Midtrans] Meminta Snap Token ke ${ep} dengan Server Key:`, MIDTRANS_SERVER_KEY)

        const response = await fetch(ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Server-Key': MIDTRANS_SERVER_KEY
          },
          body: JSON.stringify(payload)
        })

        // Ambil data respon sebagai JSON atau teks
        let data: any = null
        const rawText = await response.text().catch(() => '')
        try {
          data = JSON.parse(rawText)
        } catch (_) {
          data = rawText ? { message: rawText } : null
        }

        console.log(`[Midtrans] Status HTTP dari ${ep}:`, response.status, data)

        // Periksa apakah respon mengembalikan token
        const foundToken = data?.snap_token || data?.token || data?.data?.snap_token || data?.data?.token
        if (foundToken) {
          responseData = data
          connectedEndpoint = ep
          break
        }

        // Jika endpoint bukan proxy dan mengembalikan error, lanjut coba proxy
        if (!response.ok && ep === '/api/midtrans-token') {
          const detailError = data?.message || data?.error || data?.data?.message || data?.data?.error || (typeof data === 'string' ? data : (rawText || `HTTP Error ${response.status}`))
          console.error(`[Midtrans Error]:`, detailError)
          alert(`[Error Midtrans Token]:\n\n${detailError}`)
          isProcessingPayment.value = false
          return
        }

      } catch (err: any) {
        lastNetworkError = err
        console.warn(`[Midtrans] Gagal terhubung ke endpoint ${ep}:`, err?.message || err)
      }
    }

    if (!responseData) {
      const msg = lastNetworkError?.message || 'Gagal memperoleh token dari Midtrans.'
      console.error('[Midtrans Error Koneksi]:', lastNetworkError)
      alert(`Gagal menghubungi server token Midtrans.\n\nPesan: ${msg}`)
      isProcessingPayment.value = false
      return
    }

    // Eksekusi Midtrans Snap:
    // Jika response berhasil (menghasilkan snap_token atau token), langsung panggil window.snap.pay(data.snap_token || data.token)
    const token = responseData.snap_token || responseData.token || responseData.data?.snap_token || responseData.data?.token

    if (!token) {
      console.error('[Midtrans Error]: Respon sukses tapi tidak ada snap_token atau token:', responseData)
      alert(`Respon sukses (${connectedEndpoint}), namun token tidak ditemukan:\n\n${JSON.stringify(responseData, null, 2)}`)
      isProcessingPayment.value = false
      return
    }

    console.log('[Midtrans Sandbox] Token pembayaran berhasil diperoleh:', token)

    // Pastikan SDK Midtrans Sandbox siap sebelum snap.pay dipanggil
    const snapRunner = await loadMidtransSnap(false).catch(() => null) || (window as any).snap
    if (snapRunner && typeof snapRunner.pay === 'function') {
      console.log('[Midtrans] Menjalankan window.snap.pay dengan token Sandbox:', token)
      snapRunner.pay(token, {
        onSuccess: function (result: any) {
          isProcessingPayment.value = false
          paymentResult.value = result
          isCheckoutModalOpen.value = false
          isPaymentSuccessModalOpen.value = true
          toast.add({
            title: 'Pembayaran Sukses!',
            description: `Transaksi ${result?.order_id || ''} berhasil diverifikasi.`,
            color: 'success'
          })

          // Beritahu backend Laravel untuk update status transaksi ke sukses & kurangi stok
          const callbackPayload = {
            order_id: result?.order_id,
            payment_type: result?.payment_type,
            transaction_status: result?.transaction_status || 'settlement'
          }

          const callbackUrls = [
            'http://localhost:8000/api/midtrans-callback',
            'http://127.0.0.1:8000/api/midtrans-callback',
            '/api/midtrans-callback'
          ]
          for (const cbUrl of callbackUrls) {
            fetch(cbUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify(callbackPayload)
            }).then(() => {
              if (typeof refresh === 'function') refresh()
            }).catch(() => null)
          }

          // Kurangi stok lokal di frontend secara langsung
          if (checkoutItem.value) {
            checkoutItem.value.stok = Math.max(0, (checkoutItem.value.stok || 1) - checkoutQty.value)
            const target = localAlkesList.value.find(a => a.id === checkoutItem.value?.id || a.nama_alat === checkoutItem.value?.nama_alat)
            if (target) {
              target.stok = Math.max(0, (target.stok || 1) - checkoutQty.value)
            }
          }
        },
        onPending: function (result: any) {
          isProcessingPayment.value = false
          paymentResult.value = result
          isCheckoutModalOpen.value = false
          isPaymentPendingModalOpen.value = true
          toast.add({
            title: 'Menunggu Pembayaran',
            description: result?.status_message || 'Selesaikan pembayaran menggunakan instruksi yang tertera.',
            color: 'warning'
          })
        },
        onError: function (result: any) {
          isProcessingPayment.value = false
          paymentResult.value = result
          toast.add({
            title: 'Pembayaran Gagal',
            description: result?.status_message || 'Terjadi kendala saat pembayaran berlangsung.',
            color: 'error'
          })
        },
        onClose: function () {
          isProcessingPayment.value = false
          toast.add({
            title: 'Pop-up Ditutup',
            description: 'Anda menutup pop-up Midtrans sebelum transaksi selesai.',
            color: 'warning'
          })
        }
      })
    } else {
      alert('SDK Midtrans Snap (snap.js) belum siap di browser. Pastikan koneksi internet stabil.')
    }

    isProcessingPayment.value = false

  } catch (err: any) {
    isProcessingPayment.value = false
    console.error('[Midtrans Snap Error]:', err)
    toast.add({
      title: 'Peringatan Integrasi Midtrans',
      description: err?.message || 'Gagal memproses transaksi.',
      color: 'error'
    })
  }
}

// ============================================================================
// 8. MANAJEMEN INVENTARIS ALKES (BACK-OFFICE)
// ============================================================================
const searchQuery = ref('')
const selectedKategori = ref('Semua')
const selectedStatus = ref('Semua')

const kategoriOptions = [
  'Semua',
  'Alat Diagnostik',
  'Monitoring Pasien',
  'Bedah & Gawat Darurat',
  'Rehabilitasi Medis',
  'Laboratorium & Rehab'
]

const statusOptions = ['Semua', 'Tersedia', 'Dipakai', 'Rusak', 'Stok Terbatas']

const filteredAlkes = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return localAlkesList.value.filter(item => {
    const matchQuery = !query ||
      item.kode_alat.toLowerCase().includes(query) ||
      item.nama_alat.toLowerCase().includes(query) ||
      (item.nama_alkes && item.nama_alkes.toLowerCase().includes(query)) ||
      item.kategori.toLowerCase().includes(query) ||
      (item.lokasi_lab && item.lokasi_lab.toLowerCase().includes(query))

    const matchKategori = selectedKategori.value === 'Semua' || item.kategori === selectedKategori.value
    const matchStatus = selectedStatus.value === 'Semua' || item.status === selectedStatus.value

    return matchQuery && matchKategori && matchStatus
  })
})

const totalAlkesCount = computed(() => localAlkesList.value.length)
const totalStokUnit = computed(() => localAlkesList.value.reduce((acc, i) => acc + (Number(i.stok) || 0), 0))
const totalTersedia = computed(() => localAlkesList.value.filter(i => i.status === 'Tersedia').length)
const totalDipakai = computed(() => localAlkesList.value.filter(i => i.status === 'Dipakai').length)
const totalRusak = computed(() => localAlkesList.value.filter(i => i.status === 'Rusak').length)

const tableColumns = [
  { accessorKey: 'kode_alat', header: 'Kode Alat' },
  { accessorKey: 'nama_alat', header: 'Nama Alat & Lokasi' },
  { accessorKey: 'kategori', header: 'Kategori' },
  { accessorKey: 'stok', header: 'Stok Fisik' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions', header: 'Aksi' }
]

// Modal CRUD Inventaris
const isModalOpen = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | string | null>(null)
const isSubmitting = ref(false)

const formData = ref<{
  kode_alat: string
  nama_alat: string
  kategori: string
  stok: number
  status: 'Tersedia' | 'Dipakai' | 'Rusak' | 'Stok Terbatas'
  lokasi_lab: string
  deskripsi: string
}>({
  kode_alat: '',
  nama_alat: '',
  kategori: 'Alat Diagnostik',
  stok: 1,
  status: 'Tersedia',
  lokasi_lab: 'Lab Keperawatan & Diagnostik',
  deskripsi: ''
})

const bukaModalTambah = () => {
  isEditMode.value = false
  editingId.value = null
  formData.value = {
    kode_alat: `ALK-ANS-${String(localAlkesList.value.length + 1).padStart(2, '0')}`,
    nama_alat: '',
    kategori: 'Alat Diagnostik',
    stok: 5,
    status: 'Tersedia',
    lokasi_lab: 'Lab Keperawatan & Diagnostik',
    deskripsi: ''
  }
  isModalOpen.value = true
}

const bukaModalEdit = (item: AlkesItem) => {
  isEditMode.value = true
  editingId.value = item.id
  formData.value = {
    kode_alat: item.kode_alat,
    nama_alat: item.nama_alat,
    kategori: item.kategori,
    stok: item.stok,
    status: (item.status as any) || 'Tersedia',
    lokasi_lab: item.lokasi_lab || 'Lab Anisa Medika',
    deskripsi: item.deskripsi || ''
  }
  isModalOpen.value = true
}

const simpanAlat = async () => {
  if (!formData.value.nama_alat.trim()) {
    toast.add({
      title: 'Nama Alat Wajib Diisi',
      description: 'Mohon masukkan nama peralatan medis dengan jelas.',
      color: 'warning'
    })
    return
  }

  isSubmitting.value = true

  try {
    if (isEditMode.value && editingId.value !== null) {
      const idx = localAlkesList.value.findIndex(i => i.id === editingId.value)
      if (idx !== -1) {
        localAlkesList.value[idx] = {
          ...localAlkesList.value[idx],
          kode_alat: formData.value.kode_alat,
          nama_alat: formData.value.nama_alat,
          nama_alkes: formData.value.nama_alat,
          kategori: formData.value.kategori,
          stok: Number(formData.value.stok),
          status: formData.value.status,
          lokasi_lab: formData.value.lokasi_lab,
          deskripsi: formData.value.deskripsi
        }
      }
      toast.add({
        title: 'Berhasil Diperbarui',
        description: `Alat ${formData.value.nama_alat} berhasil diperbarui di katalog Anisa Medika.`,
        color: 'success'
      })
    } else {
      const newItem: AlkesItem = {
        id: Date.now(),
        kode_alat: formData.value.kode_alat || `ALK-ANS-${Date.now().toString().slice(-4)}`,
        nama_alat: formData.value.nama_alat,
        nama_alkes: formData.value.nama_alat,
        kategori: formData.value.kategori,
        stok: Number(formData.value.stok),
        status: formData.value.status,
        lokasi_lab: formData.value.lokasi_lab,
        deskripsi: formData.value.deskripsi,
        gambar: '/images/alkes/tensimeter.jpg',
        fallbackGambar: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=80',
        kemenkes_akl: 'KEMENKES RI AKL TERCATAT',
        harga_estimasi: 'Hubungi Sales',
        garansi: '2 Tahun Garansi Resmi'
      }
      localAlkesList.value.unshift(newItem)
      toast.add({
        title: 'Alat Baru Didaftarkan',
        description: `${newItem.nama_alat} siap dikelola di inventaris Anisa Medika.`,
        color: 'success'
      })
    }
    isModalOpen.value = false
  } finally {
    isSubmitting.value = false
  }
}

const hapusAlat = (item: AlkesItem) => {
  if (confirm(`Yakin ingin menghapus ${item.nama_alat} dari database Anisa Medika?`)) {
    localAlkesList.value = localAlkesList.value.filter(i => i.id !== item.id)
    toast.add({
      title: 'Alat Dihapus',
      description: `${item.nama_alat} telah dihapus dari inventaris.`,
      color: 'neutral'
    })
  }
}
</script>

<template>
  <UApp>
    <div
      :class="[
        'min-h-screen flex flex-col font-sans transition-colors duration-300 selection:bg-emerald-500/20 selection:text-emerald-700',
        isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      ]"
    >

      <!-- ============================================================== -->
      <!-- ANISA MEDIKA MAIN NAVBAR                                       -->
      <!-- ============================================================== -->
      <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-xs transition-colors duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <!-- Brand Logo Anisa Medika (Proporsional & Sejajar) -->
          <div class="flex items-center gap-2.5 cursor-pointer shrink-0" @click="setView('portal')">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 flex items-center justify-center shadow-md shadow-emerald-500/20 ring-1.5 ring-emerald-400/40 shrink-0">
              <UIcon name="i-lucide-activity" class="w-5 h-5 text-white animate-heart-pulse" />
            </div>
            <div class="flex flex-col justify-center">
              <div class="flex items-center gap-1.5 whitespace-nowrap">
                <span class="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                  Anisa <span class="anisa-mint-text font-black">Medika</span>
                </span>
                <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 leading-none">
                  ALKES
                </span>
              </div>
              <p class="text-[10px] text-slate-500 font-medium tracking-wide whitespace-nowrap leading-none mt-0.5">
                Toko Alat Kesehatan Medis Terpercaya
              </p>
            </div>
          </div>

          <!-- Desktop Navigation Menu -->
          <nav class="hidden lg:flex items-center gap-1">
            <button
              type="button"
              @click="setView('portal')"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                currentView === 'portal'
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-100'
              ]"
            >
              Beranda Utama
            </button>

            <button
              type="button"
              @click="setView('portal', 'galeri-alkes')"
              class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-emerald-600 hover:bg-slate-100 transition-all flex items-center gap-1.5"
            >
              <span>Galeri & Katalog Alkes</span>
              <span class="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold">
                {{ localAlkesList.length }}
              </span>
            </button>

            <button
              type="button"
              @click="setView('blog')"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5',
                currentView === 'blog'
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-100'
              ]"
            >
              <span>Halaman Blog</span>
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>

            <button
              type="button"
              @click="setView('portal', 'layanan-anisa')"
              class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-emerald-600 hover:bg-slate-100 transition-all"
            >
              Layanan & Kalibrasi
            </button>
          </nav>

          <!-- Right Action Controls (Dark Mode Toggle & Tombol Mint CTA) -->
          <div class="flex items-center gap-3">
            
            <!-- Tombol Toggle Dark/Light Mode Interaktif -->
            <button
              type="button"
              id="theme-toggle-btn"
              @click="toggleDarkMode"
              class="relative p-2.5 rounded-xl border transition-all duration-300 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer flex items-center justify-center group"
              :class="isDark 
                ? 'border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700 hover:text-amber-200' 
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-emerald-600'"
              :title="isDark ? 'Mode Gelap Aktif (Klik untuk Mode Terang)' : 'Mode Terang Aktif (Klik untuk Mode Gelap)'"
              aria-label="Toggle Dark Mode"
            >
              <div class="relative w-5 h-5 flex items-center justify-center">
                <UIcon
                  v-if="isDark"
                  name="i-lucide-moon"
                  class="w-5 h-5 text-amber-300 transition-all duration-300 transform group-hover:-rotate-12"
                />
                <UIcon
                  v-else
                  name="i-lucide-sun"
                  class="w-5 h-5 text-amber-500 transition-all duration-300 transform group-hover:rotate-45"
                />
              </div>
            </button>

            <!-- Tombol Bayar Sekarang (Midtrans Snap) -->
            <button
              type="button"
              class="hidden md:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all cursor-pointer"
              @click="bukaModalCheckout()"
              title="Buka Pembayaran Midtrans Snap"
            >
              <UIcon name="i-lucide-credit-card" class="w-4 h-4" />
              <span>Bayar Sekarang</span>
            </button>

            <!-- Tombol Mint: Minta Penawaran E-Katalog -->
            <button
              type="button"
              class="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-mint text-xs font-bold uppercase tracking-wider"
              @click="bukaModalPenawaran()"
            >
              <UIcon name="i-lucide-file-text" class="w-4 h-4" />
              <span>Minta Penawaran</span>
            </button>

            <!-- Mobile Hamburger Toggle -->
            <button
              type="button"
              @click="isMobileMenuOpen = !isMobileMenuOpen"
              class="lg:hidden p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle Mobile Menu"
            >
              <UIcon :name="isMobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'" class="w-6 h-6" />
            </button>

          </div>

        </div>

        <!-- Mobile Drawer Navigation -->
        <div
          v-if="isMobileMenuOpen"
          class="lg:hidden px-4 pt-2 pb-6 space-y-2 border-t border-slate-200 bg-white shadow-xl"
        >
          <!-- Switch Dark Mode Mobile -->
          <div class="py-2.5 px-3 mb-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <UIcon :name="isDark ? 'i-lucide-moon' : 'i-lucide-sun'" class="w-4 h-4 text-amber-500" />
              <span>{{ isDark ? 'Mode Gelap Aktif' : 'Mode Terang Aktif' }}</span>
            </span>
            <button
              type="button"
              @click="toggleDarkMode"
              class="px-3 py-1 rounded-lg border text-xs font-bold transition-all"
              :class="isDark ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-slate-300 bg-white text-slate-800'"
            >
              {{ isDark ? 'Ganti Mode Terang' : 'Ganti Mode Gelap' }}
            </button>
          </div>

          <button
            type="button"
            @click="setView('portal')"
            class="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Beranda Utama
          </button>
          <button
            type="button"
            @click="setView('portal', 'galeri-alkes')"
            class="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between"
          >
            <span>Galeri & Katalog Alkes</span>
            <span class="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">{{ localAlkesList.length }} Unit</span>
          </button>
          <button
            type="button"
            @click="setView('blog')"
            class="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Halaman Blog Medis
          </button>
          <button
            type="button"
            @click="setView('portal', 'layanan-anisa')"
            class="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Layanan & Uji Kalibrasi
          </button>
          <div class="pt-2 space-y-2">
            <button
              type="button"
              class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
              @click="bukaModalCheckout()"
            >
              <UIcon name="i-lucide-credit-card" class="w-4 h-4" />
              <span>Bayar Sekarang (Midtrans Snap)</span>
            </button>
            <button
              type="button"
              class="w-full py-3 rounded-xl btn-mint text-xs font-bold uppercase tracking-wider text-center"
              @click="bukaModalPenawaran()"
            >
              Minta E-Katalog & Penawaran
            </button>
          </div>
        </div>
      </header>

      <!-- ============================================================== -->
      <!-- VIEW 1: PORTAL ANISA MEDIKA (HERO BANNER, GALERI & LAYANAN)    -->
      <!-- ============================================================== -->
      <main v-if="currentView === 'portal'" class="flex-1">

        <!-- ============================================================ -->
        <!-- HERO BANNER UTAMA (TEMA TERANG MINT GREEN & SKY BLUE)        -->
        <!-- ============================================================ -->
        <section class="relative overflow-hidden anisa-light-banner py-16 sm:py-24 border-b border-emerald-100 shadow-xs">
          
          <!-- Background Grid & Glows -->
          <div class="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:28px_28px]"></div>
          
          <div class="absolute -top-32 -left-32 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-400/15 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <!-- Kolom Kiri: Copywriting & Value Proposition Anisa Medika -->
              <div class="lg:col-span-7 space-y-6 text-center lg:text-left">
                
                <!-- Pill Badge Kemenkes & Akreditasi -->
                <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-emerald-200/90 shadow-xs">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span class="text-xs sm:text-sm font-semibold tracking-wide text-emerald-800">
                    Katalog Resmi Kemenkes RI • Standar Akreditasi ISO 13485
                  </span>
                </div>

                <!-- Headline Utama -->
                <h1 class="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight leading-tight text-slate-900">
                  Toko & Distributor Resmi <br class="hidden sm:inline" />
                  <span class="anisa-mint-text">Alat Kesehatan Medis</span>
                  Modern Berstandar Rumah Sakit
                </h1>

                <!-- Subtitle -->
                <p class="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  <strong class="text-emerald-700 font-semibold">Anisa Medika</strong> menghadirkan solusi komprehensif peralatan medis: instrumen diagnostik akurat, patient monitor ICU, Automated External Defibrillator (AED), terapi pernapasan, hingga perlengkapan laboratorium bergaransi resmi untuk faskes di seluruh Indonesia.
                </p>

                <!-- Action CTA Buttons (Mint Solid & Sky Outlined) -->
                <div class="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                  <a
                    href="#galeri-alkes"
                    class="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl btn-mint text-sm shadow-md"
                  >
                    <UIcon name="i-lucide-layout-grid" class="w-4 h-4" />
                    <span>Jelajahi Galeri Alkes</span>
                  </a>

                  <button
                    type="button"
                    @click="bukaModalPenawaran()"
                    class="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl btn-sky-outline font-semibold text-sm transition-all shadow-xs"
                  >
                    <UIcon name="i-lucide-clipboard-check" class="w-4 h-4 text-sky-600" />
                    <span>Minta E-Katalog & Penawaran</span>
                  </button>

                  <button
                    type="button"
                    @click="setView('blog')"
                    class="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl text-emerald-700 hover:text-emerald-800 font-semibold text-sm transition-colors"
                  >
                    <span>Baca Blog Medis</span>
                    <UIcon name="i-lucide-arrow-right" class="w-4 h-4 text-emerald-600" />
                  </button>
                </div>

                <!-- Trust Statistics Anisa Medika (4 Metric Counters Terang & Jelas) -->
                <div class="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-200">
                  <div class="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div class="text-2xl sm:text-3xl font-extrabold text-slate-900">15.000+</div>
                    <div class="text-xs text-slate-500 font-medium mt-0.5">Unit Terdistribusi</div>
                  </div>
                  <div class="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-xs">
                    <div class="text-2xl sm:text-3xl font-extrabold text-emerald-600">99.9%</div>
                    <div class="text-xs text-slate-500 font-medium mt-0.5">Akurasi Kalibrasi</div>
                  </div>
                  <div class="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div class="text-2xl sm:text-3xl font-extrabold text-slate-900">450+</div>
                    <div class="text-xs text-slate-500 font-medium mt-0.5">Mitra Rumah Sakit</div>
                  </div>
                  <div class="p-3.5 rounded-xl bg-white border border-sky-200 shadow-xs">
                    <div class="text-2xl sm:text-3xl font-extrabold text-sky-600">24/7</div>
                    <div class="text-xs text-slate-500 font-medium mt-0.5">Siaga Teknisi BPFK</div>
                  </div>
                </div>

              </div>

              <!-- Kolom Kanan: Showcase Visual Kartu Alkes dengan Floating Badges -->
              <div class="lg:col-span-5 relative">
                
                <!-- Card Showcase Utama -->
                <div class="relative rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-xl bg-white group">
                  <img
                    src="/images/anisa-medika-hero.jpg"
                    alt="Peralatan Medis Anisa Medika Showcase"
                    class="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    @error="(e) => handleImgError(e, 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80')"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

                  <!-- Overlay Keterangan Gambar -->
                  <div class="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        Laboratorium Kalibrasi & Diagnostik
                      </span>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Grade A
                      </span>
                    </div>
                    <p class="text-xs text-slate-700 font-medium">
                      Showcase Anisa Medika: Patient Monitor ICU, Precision ECG, Defibrillator AED & Stetoskop Kardiologi
                    </p>
                  </div>
                </div>

                <!-- Floating Badge 1: Detak Jantung / Vitals -->
                <div class="absolute -top-6 -left-6 hidden sm:flex items-center gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-lg backdrop-blur-md animate-float">
                  <div class="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
                    <UIcon name="i-lucide-heart-pulse" class="w-5 h-5 animate-heart-pulse" />
                  </div>
                  <div>
                    <div class="text-[11px] text-slate-500 font-medium">Live Vitals Monitoring</div>
                    <div class="text-sm font-extrabold text-slate-900">HR 72 BPM | SpO2 98%</div>
                  </div>
                </div>

                <!-- Floating Badge 2: Sertifikat Kalibrasi Resmi -->
                <div class="absolute -bottom-6 -right-4 hidden sm:flex items-center gap-3 p-3.5 rounded-xl bg-white border border-emerald-200 shadow-lg backdrop-blur-md">
                  <div class="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <UIcon name="i-lucide-shield-check" class="w-5 h-5" />
                  </div>
                  <div>
                    <div class="text-[11px] text-slate-500 font-medium">Jaminan Akurasi</div>
                    <div class="text-sm font-extrabold text-emerald-700">Tersertifikasi BPFK</div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        <!-- ============================================================ -->
        <!-- 3 KARTU FITUR UNGGULAN (BERSIH & LAPANG)                     -->
        <!-- ============================================================ -->
        <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300">
              <div class="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-4">
                <UIcon name="i-lucide-truck" class="w-6 h-6" />
              </div>
              <h3 class="text-lg font-bold text-slate-900">Distribusi Cepat & Steril</h3>
              <p class="text-sm text-slate-600 mt-2 leading-relaxed">
                Pengiriman perlengkapan medis ke faskes seluruh Indonesia dengan penanganan sterilisasi berstandar Cara Distribusi Alat Kesehatan yang Baik (CDAKB).
              </p>
            </div>

            <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-300 transition-all duration-300">
              <div class="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mb-4">
                <UIcon name="i-lucide-award" class="w-6 h-6" />
              </div>
              <h3 class="text-lg font-bold text-slate-900">Uji Kalibrasi Berkala BPFK</h3>
              <p class="text-sm text-slate-600 mt-2 leading-relaxed">
                Setiap alat elektromedis dikalibrasi langsung oleh tenaga elektromedis bersertifikasi Kemenkes RI demi ketepatan diagnosis 99.9%.
              </p>
            </div>

            <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all duration-300">
              <div class="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mb-4">
                <UIcon name="i-lucide-headset" class="w-6 h-6" />
              </div>
              <h3 class="text-lg font-bold text-slate-900">Garansi & Training Nakes</h3>
              <p class="text-sm text-slate-600 mt-2 leading-relaxed">
                Dukungan purna jual 24/7, spare part original resmi, serta program bimbingan teknis operasional langsung bagi dokter, perawat, dan staf klinik.
              </p>
            </div>

          </div>
        </section>

        <!-- ============================================================ -->
        <!-- GRID GALERI / KATALOG PRODUK ALKES DI BAWAH BANNER UTAMA     -->
        <!-- ============================================================ -->
        <section id="galeri-alkes" class="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <!-- Section Title & Header -->
          <div class="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-200">
              <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5 text-emerald-600" />
              <span>Katalog & Showcase Visual Alkes Anisa Medika</span>
            </div>
            <h2 class="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Galeri Koleksi Peralatan Medis Terunggul
            </h2>
            <p class="text-sm sm:text-base text-slate-600 leading-relaxed">
              Jelajahi portofolio instrumen medis berstandar Kemenkes RI. Klik pada setiap alat untuk meninjau foto produk, lembar spesifikasi teknis, harga estimasi, serta penawaran resmi.
            </p>
          </div>

          <!-- Filter Kategori & Pencarian Galeri -->
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            
            <!-- Category Tabs -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                v-for="cat in galleryCategories"
                :key="cat"
                type="button"
                @click="galleryCategory = cat"
                :class="[
                  'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200',
                  galleryCategory === cat
                    ? 'btn-mint shadow-xs'
                    : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-100'
                ]"
              >
                {{ cat }}
              </button>
            </div>

            <!-- Search & Sort Controls -->
            <div class="flex items-center gap-3 shrink-0">
              <div class="relative w-full sm:w-64">
                <UInput
                  v-model="gallerySearch"
                  icon="i-lucide-search"
                  placeholder="Cari alat, kode, atau merk..."
                  size="sm"
                  class="w-full"
                />
              </div>

              <div class="w-36">
                <USelect
                  v-model="gallerySort"
                  :items="[
                    { label: 'Rekomendasi', value: 'default' },
                    { label: 'Nama (A - Z)', value: 'name' },
                    { label: 'Stok Terbanyak', value: 'stock' },
                    { label: 'Harga Tertinggi', value: 'price' }
                  ]"
                  size="sm"
                />
              </div>
            </div>

          </div>

          <!-- GRID DISPLAY GALERI (12 ALAT KESEHATAN LENGKAP) -->
          <div v-if="filteredGalleryList.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            <div
              v-for="alat in filteredGalleryList"
              :key="alat.id"
              class="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-400 transition-all duration-300 flex flex-col"
            >
              <!-- Container Gambar Alkes dengan Hover Zoom & Safe Fallback -->
              <div class="relative h-56 bg-slate-100 overflow-hidden cursor-pointer" @click="bukaDetailAlat(alat)">
                <img
                  :src="alat.gambar || alat.fallbackGambar"
                  :alt="alat.nama_alat"
                  class="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
                  loading="lazy"
                  @error="(e) => handleImgError(e, alat.fallbackGambar)"
                />
                
                <!-- Badge Izin Edar Kemenkes -->
                <div class="absolute top-3 left-3">
                  <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md bg-white/95 text-sky-700 border border-sky-200 backdrop-blur-md shadow-xs">
                    <UIcon name="i-lucide-badge-check" class="w-3 h-3 text-sky-600" />
                    {{ alat.kemenkes_akl?.split(' ')[2] || 'Kemenkes RI' }}
                  </span>
                </div>

                <!-- Status Stok Badge -->
                <div class="absolute top-3 right-3">
                  <span
                    :class="[
                      'text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-md shadow-xs',
                      alat.status === 'Tersedia'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : (alat.status === 'Stok Terbatas' ? 'bg-amber-50 text-amber-700 border border-amber-300' : 'bg-slate-100 text-slate-700 border border-slate-300')
                    ]"
                  >
                    {{ alat.status }}
                  </span>
                </div>

                <!-- Overlay Tombol Zoom Cepat -->
                <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    class="px-4 py-2 rounded-xl btn-mint text-xs font-bold shadow-lg flex items-center gap-1.5"
                  >
                    <UIcon name="i-lucide-maximize-2" class="w-3.5 h-3.5" />
                    <span>Lihat Spek Lengkap</span>
                  </button>
                </div>
              </div>

              <!-- Content Card -->
              <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                
                <div>
                  <!-- Kategori & Kode Alat -->
                  <div class="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span class="font-semibold text-emerald-700">{{ alat.kategori }}</span>
                    <span class="font-mono text-[11px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 border border-slate-200">
                      {{ alat.kode_alat }}
                    </span>
                  </div>

                  <!-- Judul Nama Alat -->
                  <h3
                    class="font-bold text-slate-900 text-base line-clamp-2 group-hover:text-emerald-700 transition-colors cursor-pointer"
                    @click="bukaDetailAlat(alat)"
                  >
                    {{ alat.nama_alat }}
                  </h3>

                  <!-- Snippet Deskripsi -->
                  <p class="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                    {{ alat.deskripsi }}
                  </p>
                </div>

                <!-- Estimasi Harga Resmi & 2 Tombol Aksi Fleksibel -->
                <div class="pt-3 border-t border-slate-100 flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-[10px] text-slate-400 font-medium">Estimasi Harga</div>
                      <div class="text-sm font-bold text-emerald-700">
                        {{ alat.harga_estimasi || 'Hubungi Sales' }}
                      </div>
                    </div>
                    <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {{ alat.stok ? `${alat.stok} Unit` : 'Tersedia' }}
                    </span>
                  </div>

                  <!-- 3 Tombol: Lihat Detail, Pesan & Bayar Sekarang (Midtrans) -->
                  <div class="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      class="py-2 px-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                      @click="bukaDetailAlat(alat)"
                      title="Lihat Detail Produk"
                    >
                      <UIcon name="i-lucide-eye" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span class="truncate">Detail</span>
                    </button>

                    <button
                      type="button"
                      class="py-2 px-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                      @click="bukaModalPenawaran(alat.nama_alat)"
                      title="Minta Penawaran WhatsApp"
                    >
                      <UIcon name="i-lucide-file-text" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span class="truncate">Pesan</span>
                    </button>

                    <button
                      type="button"
                      class="py-2 px-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                      @click="bukaModalCheckout(alat)"
                      title="Bayar Sekarang via Midtrans Snap"
                    >
                      <UIcon name="i-lucide-credit-card" class="w-3.5 h-3.5 shrink-0" />
                      <span class="truncate">Bayar</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>

          <!-- Empty State Galeri -->
          <div v-else class="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
            <div class="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600 mb-4 border border-emerald-200">
              <UIcon name="i-lucide-search" class="w-8 h-8" />
            </div>
            <h3 class="text-lg font-bold text-slate-900">Tidak ada alat kesehatan ditemukan</h3>
            <p class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
              Silakan coba kata kunci lain atau pilih kategori "Semua" untuk melihat katalog lengkap Anisa Medika.
            </p>
            <div class="mt-4">
              <button
                type="button"
                @click="galleryCategory = 'Semua'; gallerySearch = ''"
                class="px-4 py-2 rounded-xl btn-mint text-xs font-bold"
              >
                Reset Filter Pencarian
              </button>
            </div>
          </div>

        </section>

        <!-- ============================================================ -->
        <!-- BANNER LAYANAN & UJI KALIBRASI BPFK ANISA MEDIKA             -->
        <!-- ============================================================ -->
        <section id="layanan-anisa" class="py-16 sm:py-20 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 border-t border-b border-emerald-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-300">
          <div class="absolute -top-24 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div class="lg:col-span-8 space-y-4">
                <span class="text-xs font-bold tracking-widest text-emerald-700 uppercase">
                  Layanan Resmi Kalibrasi & Pemeliharaan Faskes
                </span>
                <h2 class="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                  Menjaga Standar Keselamatan Pasien & Akreditasi Rumah Sakit
                </h2>
                <p class="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  Anisa Medika melayani pengujian dan kalibrasi tahunan bersertifikat resmi, uji keselamatan listrik (electrical safety testing), serta kontrak servis berkala untuk rumah sakit, puskesmas, klinik, dan laboratorium medis di seluruh Indonesia.
                </p>
                <div class="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-emerald-800">
                  <div class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-emerald-600" />
                    <span>Lulus Uji BPFK Kemenkes</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-emerald-600" />
                    <span>Stiker Laik Pakai Resmi</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-emerald-600" />
                    <span>Dukungan Suku Cadang Original</span>
                  </div>
                </div>
              </div>

              <div class="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                <button
                  type="button"
                  class="py-3.5 px-6 rounded-xl btn-mint text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  @click="bukaModalPenawaran('Jadwal Kalibrasi & Servis')"
                >
                  <UIcon name="i-lucide-calendar" class="w-4 h-4" />
                  <span>Jadwalkan Kalibrasi Alat</span>
                </button>
                <button
                  type="button"
                  class="py-3.5 px-6 rounded-xl btn-sky-outline text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  @click="setView('blog')"
                >
                  <UIcon name="i-lucide-file-text" class="w-4 h-4" />
                  <span>Pelajari Regulasi Medis</span>
                </button>
              </div>

            </div>
          </div>
        </section>

      </main>

      <!-- ============================================================== -->
      <!-- VIEW 2: HALAMAN BLOG ALKES & WADAH EDUKASI KESEHATAN           -->
      <!-- ============================================================== -->
      <main v-else-if="currentView === 'blog'" class="flex-1 py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header Blog Anisa Medika -->
        <div class="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-200">
            <UIcon name="i-lucide-book-open" class="w-4 h-4 text-emerald-600" />
            <span>Pusat Edukasi & Jurnal Alkes Anisa Medika</span>
          </div>
          
          <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            Wawasan & Regulasi <br class="hidden sm:inline" />
            <span class="anisa-mint-text">Teknologi Alat Kesehatan</span>
          </h1>

          <p class="text-base text-slate-600 leading-relaxed">
            Artikel ilmiah populer, panduan kepatuhan BPFK, standar operasional kamar operasi, serta perkembangan teknologi biomedis teranyar untuk faskes dan nakes Indonesia.
          </p>
        </div>

        <!-- Filter & Search Bar Blog -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-10 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              v-for="cat in blogCategories"
              :key="cat"
              type="button"
              @click="blogCategory = cat"
              :class="[
                'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all',
                blogCategory === cat
                  ? 'btn-mint shadow-xs'
                  : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-100'
              ]"
            >
              {{ cat }}
            </button>
          </div>

          <div class="w-full sm:w-72">
            <UInput
              v-model="blogSearch"
              icon="i-lucide-search"
              placeholder="Cari artikel, topik, penulis..."
              size="sm"
              class="w-full"
            />
          </div>

        </div>

        <!-- Grid Artikel Blog -->
        <div v-if="filteredBlogList.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <article
            v-for="art in filteredBlogList"
            :key="art.id"
            class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col group cursor-pointer"
            @click="bukaArtikel(art)"
          >
            <!-- Thumbnail Gambar Artikel (Proporsional & Utuh) -->
            <div class="relative h-56 sm:h-64 overflow-hidden bg-slate-100/90 dark:bg-slate-800/80 flex items-center justify-center p-3 border-b border-slate-100 dark:border-slate-800">
              <!-- Ambient background blur effect -->
              <img
                :src="art.gambar || art.fallbackGambar"
                :alt="art.judul"
                aria-hidden="true"
                class="absolute inset-0 w-full h-full object-cover filter blur-md opacity-25 scale-110 pointer-events-none select-none"
              />
              <!-- Main Thumbnail Image with object-contain to display full image without zoom or cropping -->
              <img
                :src="art.gambar || art.fallbackGambar"
                :alt="art.judul"
                class="relative max-h-full max-w-full w-auto h-auto object-contain object-center rounded-lg shadow-2xs group-hover:scale-[1.03] transition-transform duration-300 z-10"
                loading="lazy"
                @error="(e) => handleImgError(e, art.fallbackGambar)"
              />
              <div class="absolute top-3 left-3 z-20">
                <span class="text-[10px] font-bold px-2.5 py-1 rounded-md bg-white/95 dark:bg-slate-900/90 text-emerald-800 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-700/60 shadow-xs backdrop-blur-xs">
                  {{ art.kategori }}
                </span>
              </div>
              <div class="absolute bottom-3 right-3 z-20 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
                {{ art.waktuBaca }}
              </div>
            </div>

            <!-- Konten Artikel -->
            <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
              
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-xs text-slate-500">
                  <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5 text-emerald-600" />
                  <span>{{ art.tanggal }}</span>
                </div>

                <h3 class="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2">
                  {{ art.judul }}
                </h3>

                <p class="text-xs sm:text-sm text-slate-500 line-clamp-3 leading-relaxed">
                  {{ art.ringkasan }}
                </p>
              </div>

              <!-- Author Info & Read Action -->
              <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <UAvatar
                    :src="art.penulis.avatar"
                    :alt="art.penulis.nama"
                    size="sm"
                    class="ring-1 ring-emerald-400"
                  />
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-slate-800 truncate">{{ art.penulis.nama }}</p>
                    <p class="text-[10px] text-slate-500 truncate">{{ art.penulis.gelar }}</p>
                  </div>
                </div>

                <span class="text-emerald-600 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Baca
                  <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5" />
                </span>
              </div>

            </div>
          </article>

        </div>

        <!-- Empty State Blog -->
        <div v-else class="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <div class="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600 mb-4 border border-emerald-200">
            <UIcon name="i-lucide-file-question" class="w-8 h-8" />
          </div>
          <h3 class="text-lg font-bold text-slate-900">Tidak ada artikel blog ditemukan</h3>
          <p class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
            Coba gunakan kata kunci artikel yang berbeda atau klik tombol reset di bawah.
          </p>
          <div class="mt-4">
            <button
              type="button"
              @click="blogCategory = 'Semua'; blogSearch = ''"
              class="px-4 py-2 rounded-xl btn-mint text-xs font-bold"
            >
              Reset Filter Blog
            </button>
          </div>
        </div>

      </main>

      <!-- ============================================================== -->
      <!-- VIEW 3: SISTEM INVENTARIS & DATABASE ALKES (AREA ADMIN EKSKLUSIF)-->
      <!-- ============================================================== -->
      <main v-else-if="currentView === 'inventaris'" class="flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <!-- Banner Mode Khusus Admin Backend -->
        <div class="bg-gradient-to-r from-amber-500/10 via-amber-50 to-emerald-50 dark:from-amber-950/40 dark:via-slate-900 dark:to-emerald-950/30 border border-amber-300 dark:border-amber-800/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
              <UIcon name="i-lucide-shield-check" class="w-6 h-6" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">Area Backend Eksklusif</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold">
                  Sesi Admin Aktif
                </span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Fitur tambah, edit, dan hapus stok alkes di halaman ini hanya dapat diakses oleh administrator internal Anisa Medika.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              @click="setView('portal')"
              class="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <UIcon name="i-lucide-eye" class="w-4 h-4 text-emerald-600" />
              <span>Lihat Frontend Publik</span>
            </button>
            <button
              type="button"
              @click="logoutAdmin"
              class="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <UIcon name="i-lucide-log-out" class="w-4 h-4" />
              <span>Kunci & Keluar</span>
            </button>
          </div>
        </div>
        
        <!-- Header Manajemen Inventaris -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl sm:text-3xl font-black text-slate-900">
                Database Inventaris Alkes Anisa Medika
              </h1>
              <UBadge :color="isConnectedToApi ? 'success' : 'neutral'" variant="subtle" size="sm">
                {{ isConnectedToApi ? 'Terkoneksi API' : 'Mode Mandiri' }}
              </UBadge>
            </div>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">
              Sistem pencatatan logistik, spesifikasi, dan pemantauan ketersediaan unit alat medis di laboratorium.
            </p>
          </div>

          <div class="flex items-center gap-2.5">
            <button
              type="button"
              class="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-emerald-700 hover:border-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              @click="refreshData"
              title="Perbarui Sinkronisasi Data"
            >
              <UIcon name="i-lucide-refresh-cw" :class="['w-4 h-4', isLoadingApi ? 'animate-spin' : '']" />
              <span>Sinkron</span>
            </button>

            <button
              type="button"
              class="px-4 py-2 rounded-xl btn-mint text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              @click="bukaModalTambah"
            >
              <UIcon name="i-lucide-plus" class="w-4 h-4" />
              <span>Daftarkan Alat Baru</span>
            </button>
          </div>
        </div>

        <!-- 4 Metric Cards Inventaris -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span class="text-xs font-medium text-slate-500">Total Macam Alat</span>
            <div class="text-2xl font-black text-slate-900 mt-1">{{ totalAlkesCount }} Model</div>
          </div>
          <div class="p-5 rounded-2xl bg-white border border-emerald-100 shadow-xs">
            <span class="text-xs font-medium text-slate-500">Total Stok Fisik</span>
            <div class="text-2xl font-black text-emerald-600 mt-1">{{ totalStokUnit }} Unit</div>
          </div>
          <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span class="text-xs font-medium text-slate-500">Alat Tersedia (Ready)</span>
            <div class="text-2xl font-black text-sky-600 mt-1">{{ totalTersedia }} Item</div>
          </div>
          <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span class="text-xs font-medium text-slate-500">Sedang Dipakai / Servis</span>
            <div class="text-2xl font-black text-rose-500 mt-1">{{ totalDipakai + totalRusak }} Item</div>
          </div>
        </div>

        <!-- Filter & Search Toolbar Tabel -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div class="w-full sm:w-80">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Cari kode, nama, lokasi..."
              size="sm"
              class="w-full"
            />
          </div>

          <div class="flex items-center gap-3 w-full sm:w-auto">
            <USelect
              v-model="selectedKategori"
              :items="kategoriOptions"
              size="sm"
              class="w-44"
            />
            <USelect
              v-model="selectedStatus"
              :items="statusOptions"
              size="sm"
              class="w-36"
            />
          </div>
        </div>

        <!-- Tabel Data Inventaris -->
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <UTable
            :data="filteredAlkes"
            :columns="tableColumns"
            class="w-full"
          >
            <template #kode_alat-cell="{ row }">
              <span class="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                {{ row.original.kode_alat }}
              </span>
            </template>

            <template #nama_alat-cell="{ row }">
              <div>
                <div class="font-bold text-slate-900 text-sm hover:text-emerald-700 cursor-pointer" @click="bukaDetailAlat(row.original)">
                  {{ row.original.nama_alat }}
                </div>
                <div class="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <UIcon name="i-lucide-map-pin" class="w-3 h-3 text-emerald-600" />
                  <span>{{ row.original.lokasi_lab || 'Laboratorium Anisa Medika' }}</span>
                </div>
              </div>
            </template>

            <template #kategori-cell="{ row }">
              <span class="text-xs text-slate-700 font-medium">
                {{ row.original.kategori }}
              </span>
            </template>

            <template #stok-cell="{ row }">
              <span class="text-xs font-bold text-slate-900">
                {{ row.original.stok }} Unit
              </span>
            </template>

            <template #status-cell="{ row }">
              <span
                :class="[
                  'text-[10px] font-bold px-2 py-0.5 rounded',
                  row.original.status === 'Tersedia'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                ]"
              >
                {{ row.original.status }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100"
                  @click="bukaModalEdit(row.original)"
                  title="Edit Alat"
                >
                  <UIcon name="i-lucide-pencil" class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                  @click="hapusAlat(row.original)"
                  title="Hapus Alat"
                >
                  <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                </button>
              </div>
            </template>
          </UTable>

          <div class="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>Menampilkan {{ filteredAlkes.length }} dari {{ localAlkesList.length }} instrumen</span>
            <span class="text-emerald-700 font-mono font-semibold">SIM-ALKES Anisa Medika v3.2</span>
          </div>
        </div>

      </main>

      <!-- ============================================================== -->
      <!-- FOOTER RINGKAS & ELEGAN (TEMA TERANG MINT & BIRU)              -->
      <!-- ============================================================== -->
      <footer class="bg-white text-slate-600 text-sm mt-auto border-t border-slate-200 shadow-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          <div class="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-slate-200">
            
            <!-- Logo Singkat Anisa Medika & Deskripsi 1 Kalimat -->
            <div class="space-y-3 text-center md:text-left max-w-md">
              <div class="flex items-center justify-center md:justify-start gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 flex items-center justify-center text-white shadow-sm">
                  <UIcon name="i-lucide-activity" class="w-5 h-5" />
                </div>
                <span class="text-lg font-bold text-slate-900 tracking-tight">
                  Anisa <span class="anisa-mint-text font-black">Medika</span>
                </span>
                <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                  ALKES
                </span>
              </div>
              <p class="text-xs text-slate-500 leading-relaxed">
                Distributor dan toko resmi peralatan medis, elektromedis, dan instrumen laboratorium terakreditasi Kemenkes RI untuk seluruh faskes di Indonesia.
              </p>
            </div>

            <!-- Menu Navigasi Utama -->
            <nav class="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-semibold">
              <button type="button" @click="setView('portal')" class="text-slate-600 hover:text-emerald-600 transition-colors">
                Beranda Utama
              </button>
              <button type="button" @click="setView('portal', 'galeri-alkes')" class="text-slate-600 hover:text-emerald-600 transition-colors">
                Galeri & Katalog Alkes
              </button>
              <button type="button" @click="setView('blog')" class="text-slate-600 hover:text-emerald-600 transition-colors">
                Halaman Blog
              </button>
              <button type="button" @click="setView('portal', 'layanan-anisa')" class="text-slate-600 hover:text-emerald-600 transition-colors">
                Layanan & Kalibrasi
              </button>
              <button type="button" @click="bukaModalPenawaran()" class="text-emerald-600 hover:text-emerald-700 transition-colors font-bold">
                Minta Penawaran
              </button>
            </nav>

          </div>

          <!-- Hak Cipta Utama: © 2026 Anisa Ayu Martalina -->
          <div class="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p class="font-semibold text-slate-700">
              © 2026 Anisa Ayu Martalina
            </p>
            <div class="flex items-center gap-4 sm:gap-6 text-slate-500 text-[11px] flex-wrap justify-center sm:justify-end">
              <span class="hover:text-emerald-600 cursor-pointer transition-colors">Kebijakan Privasi</span>
              <span>•</span>
              <span class="hover:text-emerald-600 cursor-pointer transition-colors">Syarat & Ketentuan Distribusi</span>
              <span>•</span>
              <span class="hover:text-emerald-600 cursor-pointer transition-colors">Standar Kalibrasi BPFK</span>
              <span>•</span>
              <button
                type="button"
                @click="bukaAksesAdmin"
                class="hover:text-emerald-700 text-slate-500 font-semibold cursor-pointer transition-colors flex items-center gap-1 hover:underline"
                title="Akses Eksklusif Staf Logistik & Administrator"
              >
                <UIcon name="i-lucide-lock" class="w-3.5 h-3.5 text-slate-400" />
                <span>Portal Khusus Staf / Admin</span>
              </button>
            </div>
          </div>

        </div>
      </footer>

      <!-- ============================================================== -->
      <!-- MODAL 1: DETAIL SPESIFIKASI ALAT (TELEPORT CENTERED LIGHTBOX)  -->
      <!-- ============================================================== -->
      <Teleport to="body">
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isDetailModalOpen && selectedDetailItem"
            class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            @click.self="isDetailModalOpen = false"
          >
            <div class="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden my-8">
              
              <!-- Modal Header -->
              <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <UIcon name="i-lucide-activity" class="w-5 h-5" />
                  </div>
                  <h3 class="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">
                    {{ selectedDetailItem.nama_alat }}
                  </h3>
                </div>
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  @click="isDetailModalOpen = false"
                >
                  <UIcon name="i-lucide-x" class="w-5 h-5" />
                </button>
              </div>

              <!-- Modal Body -->
              <div class="py-5 space-y-6 max-h-[68vh] overflow-y-auto pr-1">
                <!-- Gambar Preview Resolusi Penuh dengan Safe Fallback (Object Contain Utuh Penuh) -->
                <div class="relative h-72 sm:h-80 md:h-96 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center p-3 sm:p-4">
                  <img
                    :src="selectedDetailItem.gambar || selectedDetailItem.fallbackGambar"
                    :alt="selectedDetailItem.nama_alat"
                    class="w-full h-full object-contain object-center transition-transform duration-300"
                    style="object-fit: contain;"
                    @error="(e) => handleImgError(e, selectedDetailItem?.fallbackGambar)"
                  />
                  <div class="absolute bottom-3 left-3 flex gap-2 pointer-events-none">
                    <span class="text-xs font-bold px-2.5 py-1 rounded-md btn-mint shadow-sm">
                      {{ selectedDetailItem.kategori }}
                    </span>
                    <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-white/95 text-sky-700 border border-sky-200 shadow-sm">
                      {{ selectedDetailItem.kode_alat }}
                    </span>
                  </div>
                </div>

                <!-- Deskripsi & Status -->
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-xs font-bold text-sky-700 font-mono">
                      {{ selectedDetailItem.kemenkes_akl || 'KEMENKES RI AKL RESMI' }}
                    </span>
                    <span class="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {{ selectedDetailItem.garansi || '2 Tahun Garansi Resmi' }}
                    </span>
                  </div>
                  <p class="text-sm text-slate-600 leading-relaxed">
                    {{ selectedDetailItem.deskripsi }}
                  </p>
                </div>

                <!-- Tabel Spesifikasi Teknis -->
                <div v-if="selectedDetailItem.spesifikasi && selectedDetailItem.spesifikasi.length > 0" class="space-y-3">
                  <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <UIcon name="i-lucide-cpu" class="w-4 h-4 text-emerald-600" />
                    Lembar Spesifikasi Teknis (Technical Data Sheet)
                  </h4>
                  <div class="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                    <div
                      v-for="(spek, sIdx) in selectedDetailItem.spesifikasi"
                      :key="sIdx"
                      class="p-3 bg-slate-50 flex items-start gap-2"
                    >
                      <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span class="text-slate-700 font-medium">{{ spek }}</span>
                    </div>
                  </div>
                </div>

                <!-- Info Lokasi & Estimasi Harga -->
                <div class="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs">
                  <div>
                    <span class="text-slate-500">Estimasi Harga Pengadaan: </span>
                    <strong class="text-emerald-700 font-bold text-sm">{{ selectedDetailItem.harga_estimasi || 'Hubungi Sales' }}</strong>
                  </div>
                  <div>
                    <span class="text-slate-500">Ketersediaan Fisik: </span>
                    <strong class="text-emerald-600 font-bold">{{ selectedDetailItem.stok }} Unit Siap Kirim</strong>
                  </div>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <!-- Aksi Sebelah Kiri: Tutup -->
                <div>
                  <button
                    type="button"
                    class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-all cursor-pointer"
                    @click="isDetailModalOpen = false"
                  >
                    Tutup
                  </button>
                </div>

                <!-- Aksi Sebelah Kanan: Minta Penawaran & Bayar Sekarang -->
                <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                    @click="isDetailModalOpen = false; bukaModalPenawaran(selectedDetailItem?.nama_alat)"
                  >
                    <UIcon name="i-lucide-file-text" class="w-4 h-4 text-emerald-600" />
                    <span>Minta Penawaran</span>
                  </button>

                  <button
                    type="button"
                    class="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    @click="isDetailModalOpen = false; bukaModalCheckout(selectedDetailItem)"
                  >
                    <UIcon name="i-lucide-credit-card" class="w-4 h-4" />
                    <span>Bayar Sekarang</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </transition>
      </Teleport>

      <!-- ============================================================== -->
      <!-- MODAL 2: PEMBACA ARTIKEL BLOG (TELEPORT CENTERED LIGHTBOX)     -->
      <!-- ============================================================== -->
      <Teleport to="body">
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isArticleModalOpen && selectedArticle"
            class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            @click.self="isArticleModalOpen = false"
          >
            <div class="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden my-8">
              
              <!-- Modal Header -->
              <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <UIcon name="i-lucide-book-open" class="w-5 h-5" />
                  </div>
                  <h3 class="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">
                    {{ selectedArticle.judul }}
                  </h3>
                </div>
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  @click="isArticleModalOpen = false"
                >
                  <UIcon name="i-lucide-x" class="w-5 h-5" />
                </button>
              </div>

              <!-- Modal Body -->
              <div class="py-5 space-y-6 max-h-[75vh] overflow-y-auto pr-1">
                <!-- Gambar Utama Artikel Detail (Proporsional & Object-Contain) -->
                <div class="relative w-full h-64 sm:h-72 md:h-80 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900/5 dark:bg-slate-950/60 flex items-center justify-center p-3 sm:p-4">
                  <!-- Ambient soft blur backdrop matching the article image colors -->
                  <img
                    :src="selectedArticle.gambar || selectedArticle.fallbackGambar"
                    :alt="selectedArticle.judul"
                    aria-hidden="true"
                    class="absolute inset-0 w-full h-full object-cover filter blur-xl opacity-20 dark:opacity-30 scale-110 pointer-events-none select-none"
                  />
                  <!-- Main Image without any cut-off or over-zoom -->
                  <img
                    :src="selectedArticle.gambar || selectedArticle.fallbackGambar"
                    :alt="selectedArticle.judul"
                    class="relative max-h-full max-w-full w-auto h-auto object-contain object-center rounded-xl shadow-sm z-10"
                    @error="(e) => handleImgError(e, selectedArticle?.fallbackGambar)"
                  />
                  <div class="absolute bottom-3 left-3 z-20">
                    <span class="text-xs font-bold px-3 py-1 rounded-lg btn-mint shadow-sm">
                      {{ selectedArticle.kategori }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
                  <div class="flex items-center gap-2">
                    <UAvatar :src="selectedArticle.penulis.avatar" size="xs" />
                    <span class="font-semibold text-slate-900">{{ selectedArticle.penulis.nama }} ({{ selectedArticle.penulis.gelar }})</span>
                  </div>
                  <span class="text-emerald-700 font-semibold">{{ selectedArticle.tanggal }} • {{ selectedArticle.waktuBaca }}</span>
                </div>

                <!-- Poin Kunci Ringkasan -->
                <div class="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-2">
                  <h5 class="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-emerald-600" />
                    Poin Kunci Edukasi
                  </h5>
                  <ul class="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                    <li v-for="(poin, pIdx) in selectedArticle.poinKunci" :key="pIdx">{{ poin }}</li>
                  </ul>
                </div>

                <!-- Paragraf Lengkap -->
                <div class="space-y-4 text-sm text-slate-600 leading-relaxed">
                  <p v-for="(paragraf, pIdx) in selectedArticle.isiLengkap" :key="pIdx">
                    {{ paragraf }}
                  </p>
                </div>

                <!-- Tags -->
                <div class="flex flex-wrap items-center gap-2 pt-2">
                  <span class="text-xs text-slate-400">Topik Terkait:</span>
                  <span
                    v-for="t in selectedArticle.tags"
                    :key="t"
                    class="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                  >
                    #{{ t }}
                  </span>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  class="px-5 py-2.5 rounded-xl btn-mint text-xs font-bold uppercase tracking-wider"
                  @click="isArticleModalOpen = false"
                >
                  Selesai Membaca
                </button>
              </div>

            </div>
          </div>
        </transition>
      </Teleport>

      <!-- ============================================================== -->
      <!-- MODAL 3: PENAWARAN & KONSULTASI (TELEPORT CENTERED LIGHTBOX)   -->
      <!-- ============================================================== -->
      <Teleport to="body">
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isQuoteModalOpen"
            class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            @click.self="isQuoteModalOpen = false"
          >
            <div class="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden my-8">
              
              <!-- Modal Header -->
              <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 class="text-base sm:text-lg font-bold text-slate-900">
                    Formulir Penawaran Resmi - Anisa Medika
                  </h3>
                  <p class="text-xs text-slate-500 mt-0.5">
                    Dapatkan penawaran harga dan konsultasi dengan konsultan elektromedis.
                  </p>
                </div>
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  @click="isQuoteModalOpen = false"
                >
                  <UIcon name="i-lucide-x" class="w-5 h-5" />
                </button>
              </div>

              <!-- Modal Body -->
              <form @submit.prevent="kirimPenawaran" class="py-5 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                    <input
                      v-model="quoteForm.nama"
                      type="text"
                      placeholder="Contoh: dr. Hendra Wijaya"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Nama RS / Klinik *</label>
                    <input
                      v-model="quoteForm.instansi"
                      type="text"
                      placeholder="Contoh: RS Medika Pratama"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP *</label>
                    <input
                      v-model="quoteForm.telepon"
                      type="text"
                      placeholder="0812-XXXX-XXXX"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Alat yang Diminati</label>
                    <input
                      v-model="quoteForm.alatDipilih"
                      type="text"
                      placeholder="Contoh: USG 4D / AED"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Catatan Kebutuhan / Jumlah Unit</label>
                  <textarea
                    v-model="quoteForm.pesan"
                    rows="3"
                    placeholder="Tuliskan spesifikasi khusus, target pengiriman, atau jadwal kalibrasi..."
                    class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                  ></textarea>
                </div>
              </form>

              <!-- Modal Footer -->
              <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 text-xs font-semibold"
                  @click="isQuoteModalOpen = false"
                >
                  Batal
                </button>
                <button
                  type="button"
                  class="px-5 py-2.5 rounded-xl btn-mint text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  @click="kirimPenawaran"
                >
                  <UIcon name="i-lucide-send" class="w-4 h-4" />
                  <span>Kirim ke WhatsApp Sales</span>
                </button>
              </div>

            </div>
          </div>
        </transition>
      </Teleport>

      <!-- ============================================================== -->
      <!-- MODAL 4: INVENTARIS CRUD (TELEPORT CENTERED LIGHTBOX)          -->
      <!-- ============================================================== -->
      <Teleport to="body">
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isModalOpen"
            class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            @click.self="isModalOpen = false"
          >
            <div class="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden my-8">
              
              <!-- Modal Header -->
              <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 class="text-base sm:text-lg font-bold text-slate-900">
                    {{ isEditMode ? 'Edit Data Alat Medis' : 'Daftarkan Peralatan Medis Baru' }}
                  </h3>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ isEditMode ? 'Perbarui informasi spesifikasi dan stok alat.' : 'Daftarkan instrumen medis ke inventaris Anisa Medika.' }}
                  </p>
                </div>
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  @click="isModalOpen = false"
                >
                  <UIcon name="i-lucide-x" class="w-5 h-5" />
                </button>
              </div>

              <!-- Modal Body -->
              <form @submit.prevent="simpanAlat" class="py-5 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Kode Alat *</label>
                    <input
                      v-model="formData.kode_alat"
                      type="text"
                      placeholder="Contoh: ALK-ANS-01"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Alat Medis *</label>
                    <input
                      v-model="formData.nama_alat"
                      type="text"
                      placeholder="Contoh: Tensimeter Digital"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Kategori Alkes *</label>
                    <select
                      v-model="formData.kategori"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="Alat Diagnostik">Alat Diagnostik</option>
                      <option value="Monitoring Pasien">Monitoring Pasien</option>
                      <option value="Bedah & Gawat Darurat">Bedah & Gawat Darurat</option>
                      <option value="Rehabilitasi Medis">Rehabilitasi Medis</option>
                      <option value="Laboratorium & Rehab">Laboratorium & Rehab</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Jumlah Stok Fisik *</label>
                    <input
                      v-model.number="formData.stok"
                      type="number"
                      min="0"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Status Kondisi *</label>
                    <select
                      v-model="formData.status"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="Tersedia">Tersedia</option>
                      <option value="Dipakai">Dipakai</option>
                      <option value="Rusak">Rusak</option>
                      <option value="Stok Terbatas">Stok Terbatas</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Lokasi Ruangan / Lab</label>
                    <input
                      v-model="formData.lokasi_lab"
                      type="text"
                      placeholder="Contoh: Lab Diagnostik"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Deskripsi / Catatan Kalibrasi</label>
                  <textarea
                    v-model="formData.deskripsi"
                    rows="3"
                    placeholder="Catatan spesifikasi teknis atau sertifikasi kalibrasi BPFK..."
                    class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                  ></textarea>
                </div>
              </form>

              <!-- Modal Footer -->
              <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 text-xs font-semibold"
                  @click="isModalOpen = false"
                >
                  Batal
                </button>
                <button
                  type="button"
                  class="px-5 py-2.5 rounded-xl btn-mint text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  :disabled="isSubmitting"
                  @click="simpanAlat"
                >
                  <UIcon name="i-lucide-check" class="w-4 h-4" />
                  <span>{{ isEditMode ? 'Simpan Perubahan' : 'Daftarkan Alat' }}</span>
                </button>
              </div>

            </div>
          </div>
        </transition>
      </Teleport>

      <!-- ============================================================== -->
      <!-- MODAL 4: VERIFIKASI AKSES AREA KHUSUS ADMIN INVENTARIS         -->
      <!-- ============================================================== -->
      <Teleport to="body">
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isAdminLoginModalOpen"
            class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            @click.self="isAdminLoginModalOpen = false"
          >
            <div class="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                    <UIcon name="i-lucide-shield-check" class="w-5 h-5" />
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-slate-900">Portal Area Khusus Admin</h3>
                    <p class="text-[11px] text-slate-500">Autentikasi Internal Anisa Medika</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  @click="isAdminLoginModalOpen = false"
                >
                  <UIcon name="i-lucide-x" class="w-5 h-5" />
                </button>
              </div>

              <form @submit.prevent="verifikasiAdmin" class="py-5 space-y-4">
                <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  Sistem inventaris, penambahan, pengeditan, dan penghapusan data alkes hanya diperuntukkan bagi staf logistik & administrator.
                </div>

                <div class="space-y-1.5">
                  <label class="block text-xs font-bold text-slate-700">Masukkan PIN Admin *</label>
                  <input
                    v-model="adminPinInput"
                    type="password"
                    placeholder="Masukkan PIN Admin (Contoh: 1234)"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    autofocus
                    required
                  />
                  <div v-if="adminPinError" class="text-xs text-rose-600 font-semibold pt-1 flex items-center gap-1">
                    <UIcon name="i-lucide-alert-circle" class="w-3.5 h-3.5 shrink-0" />
                    <span>{{ adminPinError }}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Petunjuk Akses Cepat:</span>
                  <span class="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">PIN: 1234</span>
                </div>

                <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                    @click="isAdminLoginModalOpen = false"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    class="px-5 py-2 rounded-xl btn-mint text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <UIcon name="i-lucide-unlock" class="w-4 h-4" />
                    <span>Buka Panel Inventaris</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </transition>
      </Teleport>

      <!-- ============================================================== -->
      <!-- MODAL CHECKOUT & PEMBAYARAN MIDTRANS SNAP                     -->
      <!-- ============================================================== -->
      <Teleport to="body">
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isCheckoutModalOpen && checkoutItem"
            class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            @click.self="isCheckoutModalOpen = false"
          >
            <div class="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-5 sm:p-7 overflow-hidden my-6">
              
              <!-- Modal Header -->
              <div class="flex items-start justify-between pb-4 border-b border-slate-100">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <UIcon name="i-lucide-shield-check" class="w-3.5 h-3.5" />
                      Midtrans Snap Sandbox
                    </span>
                    <span class="text-[11px] font-semibold text-slate-400">Pembayaran Resmi</span>
                  </div>
                  <h3 class="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight">
                    Checkout & Pembayaran Alkes
                  </h3>
                  <p class="text-xs text-slate-500">
                    Selesaikan pesanan alat kesehatan dengan proses cepat dan aman terenkripsi.
                  </p>
                </div>
                <button
                  type="button"
                  class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  @click="isCheckoutModalOpen = false"
                >
                  <UIcon name="i-lucide-x" class="w-5 h-5" />
                </button>
              </div>

              <!-- Modal Body Grid (2 Kolom di Desktop) -->
              <div class="py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[70vh] overflow-y-auto pr-1">
                
                <!-- Kolom Kiri: Rincian Barang & Kalkulasi Total (5 Kolom) -->
                <div class="lg:col-span-5 space-y-4">
                  <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div class="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <UIcon name="i-lucide-shopping-bag" class="w-4 h-4 text-emerald-600" />
                      Rincian Barang Terpilih
                    </div>

                    <!-- Thumbnail & Info Produk -->
                    <div class="flex gap-3">
                      <div class="w-20 h-20 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1.5">
                        <img
                          :src="checkoutItem.gambar || checkoutItem.fallbackGambar"
                          :alt="checkoutItem.nama_alat"
                          class="w-full h-full object-contain"
                          @error="(e) => handleImgError(e, checkoutItem?.fallbackGambar)"
                        />
                      </div>
                      <div class="flex-1 min-w-0">
                        <span class="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                          {{ checkoutItem.kode_alat }}
                        </span>
                        <h4 class="text-xs font-bold text-slate-900 mt-1 line-clamp-2">
                          {{ checkoutItem.nama_alat }}
                        </h4>
                        <div class="text-[11px] text-slate-500 mt-0.5">
                          Kategori: {{ checkoutItem.kategori }}
                        </div>
                      </div>
                    </div>

                    <!-- Unit Price & Quantity Selector -->
                    <div class="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span class="text-slate-500 block text-[10px]">Harga Satuan:</span>
                        <strong class="text-slate-900 font-bold">{{ formatRupiah(checkoutUnitPrice) }}</strong>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-slate-500 text-[11px]">Jumlah:</span>
                        <div class="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                          <button
                            type="button"
                            class="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold disabled:opacity-40"
                            :disabled="checkoutQty <= 1"
                            @click="ubahCheckoutQty(-1)"
                          >
                            -
                          </button>
                          <span class="px-2.5 py-1 text-xs font-bold text-slate-900 min-w-7 text-center">
                            {{ checkoutQty }}
                          </span>
                          <button
                            type="button"
                            class="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold disabled:opacity-40"
                            :disabled="checkoutQty >= (checkoutItem.stok || 99)"
                            @click="ubahCheckoutQty(1)"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Ringkasan Biaya -->
                  <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
                    <div class="flex justify-between text-slate-600">
                      <span>Subtotal ({{ checkoutQty }} unit):</span>
                      <span class="font-semibold text-slate-900">{{ formatRupiah(checkoutGrossAmount) }}</span>
                    </div>
                    <div class="flex justify-between text-slate-600">
                      <span>Biaya Layanan & Pajak:</span>
                      <span class="font-semibold text-emerald-700">Rp 0 (Ditanggung Toko)</span>
                    </div>
                    <div class="pt-2 border-t border-emerald-200 flex justify-between items-baseline">
                      <span class="font-bold text-slate-900 text-sm">Total Bayar:</span>
                      <strong class="font-extrabold text-emerald-700 text-base sm:text-lg">
                        {{ formatRupiah(checkoutGrossAmount) }}
                      </strong>
                    </div>
                  </div>

                  <!-- Channel Pembayaran Terverifikasi -->
                  <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <UIcon name="i-lucide-check-circle-2" class="w-3.5 h-3.5 text-emerald-600" />
                      Metode Pembayaran Didukung
                    </div>
                    <div class="flex flex-wrap gap-1.5 text-[10px] font-medium text-slate-700">
                      <span class="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">QRIS / GoPay</span>
                      <span class="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">ShopeePay</span>
                      <span class="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">BCA VA</span>
                      <span class="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">Mandiri Livin</span>
                      <span class="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">BNI & BRI</span>
                      <span class="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">Kartu Kredit</span>
                    </div>
                  </div>
                </div>

                <!-- Kolom Kanan: Data Pembeli & Tombol Bayar (7 Kolom) -->
                <div class="lg:col-span-7 space-y-4">
                  <div class="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <UIcon name="i-lucide-user-check" class="w-4 h-4 text-emerald-600" />
                    Data Pemesan & Tagihan
                  </div>

                  <form @submit.prevent="prosesPembayaranMidtrans" class="space-y-3.5">
                    <!-- Input first_name -->
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Lengkap / Nama PIC Instansi <span class="text-rose-500">*</span>
                      </label>
                      <div class="relative">
                        <UIcon name="i-lucide-user" class="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          v-model="checkoutForm.first_name"
                          type="text"
                          placeholder="Contoh: dr. Anisa Martalina"
                          class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    <!-- Input email -->
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 mb-1">
                        Alamat Email Resmi <span class="text-rose-500">*</span>
                      </label>
                      <div class="relative">
                        <UIcon name="i-lucide-mail" class="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          v-model="checkoutForm.email"
                          type="email"
                          placeholder="contoh: anisa@klinik.co.id"
                          class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                          required
                        />
                      </div>
                      <span class="text-[10px] text-slate-400 mt-1 block">
                        Invoice resmi dan bukti transaksi Midtrans akan dikirimkan ke email ini.
                      </span>
                    </div>

                    <!-- Input phone -->
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor WhatsApp / HP
                      </label>
                      <div class="relative">
                        <UIcon name="i-lucide-phone" class="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          v-model="checkoutForm.phone"
                          type="text"
                          placeholder="081234567890"
                          class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <!-- Input Catatan Tambahan -->
                    <div>
                      <label class="block text-xs font-semibold text-slate-700 mb-1">
                        Catatan Pengiriman / Nama Fasilitas Kesehatan (Opsional)
                      </label>
                      <textarea
                        v-model="checkoutForm.catatan"
                        rows="2"
                        placeholder="Contoh: Unit Gawat Darurat RSUD, sertakan surat kalibrasi..."
                        class="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                      ></textarea>
                    </div>

                    <!-- Security Alert Note -->
                    <div class="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-2.5 text-[11px] text-sky-800">
                      <UIcon name="i-lucide-info" class="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Mode Pengujian (Sandbox):</strong> Gunakan nomor kartu tes atau simulator Virtual Account Midtrans resmi untuk mencoba pembayaran tanpa pemotongan saldo nyata.
                      </div>
                    </div>

                    <!-- Tombol Bayar Sekarang Action -->
                    <div class="pt-2">
                      <button
                        type="submit"
                        :disabled="isProcessingPayment"
                        class="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-75 cursor-pointer"
                      >
                        <UIcon
                          v-if="isProcessingPayment"
                          name="i-lucide-loader-2"
                          class="w-5 h-5 animate-spin"
                        />
                        <UIcon
                          v-else
                          name="i-lucide-lock"
                          class="w-5 h-5"
                        />
                        <span>{{ isProcessingPayment ? 'Menyiapkan Midtrans Snap...' : 'Bayar Sekarang - ' + formatRupiah(checkoutGrossAmount) }}</span>
                      </button>
                    </div>
                  </form>
                </div>

              </div>

              <!-- Modal Footer -->
              <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-shield-alert" class="w-4 h-4 text-emerald-600" />
                  <span>Enkripsi SSL 256-bit & Gateway Terlisensi</span>
                </div>
                <button
                  type="button"
                  class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 font-semibold"
                  @click="isCheckoutModalOpen = false"
                >
                  Batal
                </button>
              </div>

            </div>
          </div>
        </transition>
      </Teleport>

      <!-- ============================================================== -->
      <!-- MODAL PEMBAYARAN BERHASIL (SUCCESS STATE)                     -->
      <!-- ============================================================== -->
      <Teleport to="body">
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isPaymentSuccessModalOpen"
            class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            @click.self="isPaymentSuccessModalOpen = false"
          >
            <div class="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-center space-y-5 my-8 print-receipt-area">
              <div class="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <UIcon name="i-lucide-check-circle" class="w-12 h-12" />
              </div>

              <div class="space-y-1">
                <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Transaksi Berhasil
                </span>
                <h3 class="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  Pembayaran Terkonfirmasi!
                </h3>
                <p class="text-xs text-slate-500 max-w-sm mx-auto">
                  Terima kasih, pesanan alat kesehatan Anda telah berhasil diverifikasi melalui gateway Midtrans.
                </p>
              </div>

              <!-- Rincian Nota Pembayaran -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5">
                <div class="flex justify-between">
                  <span class="text-slate-500">ID Pesanan:</span>
                  <span class="font-mono font-bold text-slate-900">{{ paymentResult?.order_id || 'ORDER-' + Date.now() }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Alat Dipesan:</span>
                  <span class="font-semibold text-slate-900">{{ checkoutItem?.nama_alat || 'Alat Medis' }} (x{{ checkoutQty }})</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Metode Bayar:</span>
                  <span class="font-semibold text-slate-900 uppercase">{{ paymentResult?.payment_type || 'Midtrans Snap' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Status Gateway:</span>
                  <span class="font-bold text-emerald-700 uppercase">{{ paymentResult?.transaction_status || 'settlement' }}</span>
                </div>
                <div class="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span class="font-bold text-slate-900">Total Dibayar:</span>
                  <strong class="font-black text-emerald-700 text-base">
                    {{ formatRupiah(checkoutGrossAmount) }}
                  </strong>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  class="flex-1 py-3 px-5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5"
                  @click="window.print()"
                >
                  <UIcon name="i-lucide-printer" class="w-4 h-4" />
                  <span>Cetak Tanda Terima</span>
                </button>
                <button
                  type="button"
                  class="flex-1 py-3 px-5 rounded-xl btn-mint text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                  @click="isPaymentSuccessModalOpen = false"
                >
                  <UIcon name="i-lucide-check" class="w-4 h-4" />
                  <span>Selesai</span>
                </button>
              </div>
            </div>
          </div>
        </transition>
      </Teleport>

      <!-- ============================================================== -->
      <!-- MODAL STATUS PENDING (INSTRUKSI VA / QRIS)                    -->
      <!-- ============================================================== -->
      <Teleport to="body">
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isPaymentPendingModalOpen"
            class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            @click.self="isPaymentPendingModalOpen = false"
          >
            <div class="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-center space-y-5 my-8">
              <div class="w-20 h-20 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-inner">
                <UIcon name="i-lucide-clock" class="w-12 h-12" />
              </div>

              <div class="space-y-1">
                <span class="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                  Menunggu Pembayaran
                </span>
                <h3 class="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  Instruksi Pembayaran Diterbitkan
                </h3>
                <p class="text-xs text-slate-500 max-w-sm mx-auto">
                  Silakan selesaikan pembayaran sesuai nomor Virtual Account atau kode QR yang telah diterbitkan oleh sistem Midtrans.
                </p>
              </div>

              <!-- Rincian Tagihan Pending -->
              <div class="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-left text-xs space-y-2.5">
                <div class="flex justify-between">
                  <span class="text-slate-600">ID Pesanan:</span>
                  <span class="font-mono font-bold text-slate-900">{{ paymentResult?.order_id || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-600">Metode Tagihan:</span>
                  <span class="font-semibold text-slate-900 uppercase">{{ paymentResult?.payment_type || 'Virtual Account' }}</span>
                </div>
                <div v-if="paymentResult?.va_numbers && paymentResult.va_numbers.length > 0" class="flex justify-between">
                  <span class="text-slate-600">Nomor Virtual Account:</span>
                  <span class="font-mono font-bold text-emerald-700 text-sm">{{ paymentResult.va_numbers[0].va_number }} ({{ paymentResult.va_numbers[0].bank?.toUpperCase() }})</span>
                </div>
                <div class="pt-2 border-t border-amber-200 flex justify-between items-baseline">
                  <span class="font-bold text-slate-900">Total Tagihan:</span>
                  <strong class="font-black text-amber-700 text-base">
                    {{ formatRupiah(checkoutGrossAmount) }}
                  </strong>
                </div>
              </div>

              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  class="flex-1 py-3 px-5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold"
                  @click="isPaymentPendingModalOpen = false"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  class="flex-1 py-3 px-5 rounded-xl btn-mint text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                  @click="isPaymentPendingModalOpen = false; toast.add({ title: 'Status Disimpan', description: 'Silakan konfirmasi ke admin bila sudah transfer.', color: 'info' })"
                >
                  <UIcon name="i-lucide-check-circle" class="w-4 h-4" />
                  <span>Saya Sudah Transfer</span>
                </button>
              </div>
            </div>
          </div>
        </transition>
      </Teleport>

      <!-- Floating Toast Notifications (Mint & Slate Light Aesthetic) -->
      <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <transition-group
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform translate-y-3 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="transform translate-y-0 opacity-100"
          leave-to-class="transform translate-y-3 opacity-0"
        >
          <div
            v-for="t in activeToasts"
            :key="t.id"
            class="pointer-events-auto p-4 rounded-xl shadow-xl border flex items-start gap-3 backdrop-blur-xl bg-white"
            :class="[
              t.color === 'success' ? 'border-emerald-300 text-emerald-800' :
              t.color === 'warning' ? 'border-amber-300 text-amber-800' :
              t.color === 'error' ? 'border-rose-300 text-rose-800' :
              'border-sky-300 text-sky-800'
            ]"
          >
            <UIcon
              :name="t.color === 'success' ? 'i-lucide-check-circle' : (t.color === 'warning' ? 'i-lucide-alert-triangle' : 'i-lucide-info')"
              class="w-5 h-5 shrink-0 mt-0.5"
            />
            <div class="flex-1">
              <h5 class="text-sm font-bold text-slate-900">{{ t.title }}</h5>
              <p v-if="t.description" class="text-xs text-slate-600 mt-0.5">{{ t.description }}</p>
            </div>
            <button
              type="button"
              @click="activeToasts = activeToasts.filter(item => item.id !== t.id)"
              class="text-slate-400 hover:text-slate-700"
            >
              <UIcon name="i-lucide-x" class="w-4 h-4" />
            </button>
          </div>
        </transition-group>
      </div>

    </div>
  </UApp>
</template>
