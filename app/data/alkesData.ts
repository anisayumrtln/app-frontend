/**
 * ============================================================================
 * MASTER DATA ALAT KESEHATAN (ALKES)
 * ============================================================================
 * PANDUAN MENGGANTI FOTO ALKES DENGAN FOTO ANDA SENDIRI:
 * 1. Simpan file foto Anda di folder: public/images/alkes/
 *    (Contoh: public/images/alkes/tensimeter.jpg)
 * 2. Ubah properti `gambar` di bawah ini sesuai nama file Anda:
 *    gambar: '/images/alkes/tensimeter.jpg'
 * 3. Jika file lokal belum ada atau gagal dimuat, sistem akan otomatis
 *    menampilkan gambar cadangan dari `fallbackGambar` (Unsplash medical).
 * ============================================================================
 */

export interface AlkesItem {
  id: number | string
  kode_alat: string
  nama_alat: string
  nama_alkes?: string
  kategori: string
  stok: number
  status: 'Tersedia' | 'Dipakai' | 'Rusak' | 'Stok Terbatas' | string
  lokasi_lab?: string
  deskripsi?: string
  gambar: string          // Path lokal di public/images/alkes/... atau URL
  fallbackGambar: string  // URL cadangan (Unsplash) jika file lokal belum dimasukkan
  spesifikasi?: string[]
  kemenkes_akl?: string
  harga_estimasi?: string
  garansi?: string
  is_featured?: boolean
}

export const masterAlkesCollection: AlkesItem[] = [
  {
    id: 1,
    kode_alat: 'ALK-TNS-01',
    nama_alat: 'Tensimeter Digital Otomatis (Sphygmomanometer)',
    nama_alkes: 'Tensimeter Digital Otomatis (Sphygmomanometer)',
    kategori: 'Alat Diagnostik',
    stok: 15,
    status: 'Tersedia',
    lokasi_lab: 'Lab Keperawatan & Diagnostik',
    deskripsi: 'Alat pengukur tekanan darah digital akurasi tinggi dengan teknologi manset otomatis IntelliSense dan memori 90 riwayat pemeriksaan.',
    gambar: '/images/alkes/tensimeter.jpg',
    fallbackGambar: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=900&q=80',
    kemenkes_akl: 'KEMENKES RI AKL 20501912830',
    harga_estimasi: 'Rp 1.850.000',
    garansi: '2 Tahun Garansi Resmi',
    is_featured: true,
    spesifikasi: [
      'Rentang Tekanan: 0 - 299 mmHg (Akurasi ±3 mmHg)',
      'Rentang Detak Nadi: 40 - 180 denyut/menit',
      'Teknologi Pengisian Udara: Fuzzy-Logic IntelliSense',
      'Ukuran Manset: Cuff Fleksibel Dewasa 22 - 42 cm',
      'Indikator Khusus: Deteksi Aritmia & Hipertensi Dini'
    ]
  },
  {
    id: 2,
    kode_alat: 'ALK-STT-02',
    nama_alat: 'Stetoskop Kardiologi Littmann Classic III Precision',
    nama_alkes: 'Stetoskop Kardiologi Littmann Classic III Precision',
    kategori: 'Alat Diagnostik',
    stok: 22,
    status: 'Tersedia',
    lokasi_lab: 'Lab Fisiologi & Praktikum',
    deskripsi: 'Instrumen akustik sensitivitas tinggi untuk auskultasi suara denyut jantung, paru, dan vaskular dengan diafragma tunable dua sisi.',
    gambar: '/images/alkes/stetoskop.jpg',
    fallbackGambar: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=80',
    kemenkes_akl: 'KEMENKES RI AKL 10501610992',
    harga_estimasi: 'Rp 2.450.000',
    garansi: '5 Tahun Garansi Internasional',
    is_featured: true,
    spesifikasi: [
      'Chestpiece: Dual-Sided Machined Stainless Steel',
      'Diafragma: Tunable Akustik Sensitif Dewasa & Pediatri',
      'Material Selang: Lateks Bebas Alergi & Tahan Minyak Kulit',
      'Eartips: Soft-Sealing Kedap Suara Eksternal',
      'Panjang Tabung: 69 cm Ergonomis Ringan'
    ]
  },
  {
    id: 3,
    kode_alat: 'ALK-OXI-03',
    nama_alat: 'Pulse Oximeter Fingertip Digital OLED SpO2',
    nama_alkes: 'Pulse Oximeter Fingertip Digital OLED SpO2',
    kategori: 'Monitoring Pasien',
    stok: 28,
    status: 'Tersedia',
    lokasi_lab: 'Lab Keperawatan Dasar & ICU',
    deskripsi: 'Alat pemantau saturasi oksigen darah (SpO2) dan denyut nadi real-time via klip ujung jari pasien dengan layar OLED 4 arah.',
    gambar: '/images/alkes/oximeter.jpg',
    fallbackGambar: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=900&q=80',
    kemenkes_akl: 'KEMENKES RI AKL 20502021155',
    harga_estimasi: 'Rp 450.000',
    garansi: '1 Tahun Ganti Baru',
    is_featured: false,
    spesifikasi: [
      'Rentang SpO2: 70% - 100% (Akurasi Presisi ±2%)',
      'Rentang Pulse Rate: 30 - 250 BPM',
      'Tipe Layar: Dual Color Multi-Directional HD OLED',
      'Fitur Tambahan: Perfusion Index (PI) & Gelombang Plethysmogram',
      'Daya: 2x Baterai AAA dengan Auto Shut-off 8 detik'
    ]
  },
  {
    id: 4,
    kode_alat: 'ALK-DFB-04',
    nama_alat: 'Automated External Defibrillator (AED) Smart Lifeguard',
    nama_alkes: 'Automated External Defibrillator (AED) Smart Lifeguard',
    kategori: 'Bedah & Gawat Darurat',
    stok: 4,
    status: 'Tersedia',
    lokasi_lab: 'Lab Gawat Darurat & Trauma (IGD)',
    deskripsi: 'Defibrilator portabel cerdas untuk tindakan resusitasi jantung paru (RJP) pada korban henti jantung dengan panduan suara otomatis dwibahasa.',
    gambar: '/images/alkes/defibrillator.jpg',
    fallbackGambar: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=80',
    kemenkes_akl: 'KEMENKES RI AKL 20501813401',
    harga_estimasi: 'Rp 38.500.000',
    garansi: '5 Tahun Garansi Pabrik',
    is_featured: true,
    spesifikasi: [
      'Energi Kejut: Gelombang Bifasik Terkompensasi Impendansi 150-200J',
      'Panduan Operasional: Suara & Grafis Animasi Bahasa Indonesia',
      'CPR Feedback: Metronom Real-Time Ritme Kompresi Dada',
      'Sertifikasi Daya Tahan: IP55 Tahan Air & Debu Ekstrem',
      'Pengujian: Self-Test Harian & Mingguan Status Siap Pakai'
    ]
  },
  {
    id: 9,
    kode_alat: 'ALK-WCH-09',
    nama_alat: 'Kursi Roda Medis Lipat Stainless Steel Ergonomis',
    nama_alkes: 'Kursi Roda Medis Lipat Stainless Steel Ergonomis',
    kategori: 'Rehabilitasi Medis',
    stok: 14,
    status: 'Tersedia',
    lokasi_lab: 'Gudang Logistik & Fisioterapi',
    deskripsi: 'Kursi roda rangka baja tahan karat berlapis krom dengan dudukan empuk ergonomis dan rem ganda untuk mobilitas pasien rumah sakit.',
    gambar: '/images/alkes/kursi-roda.jpg',
    fallbackGambar: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=900&q=80',
    kemenkes_akl: 'KEMENKES RI AKD 11402910440',
    harga_estimasi: 'Rp 2.100.000',
    garansi: '1 Tahun Rangka',
    is_featured: false,
    spesifikasi: [
      'Bahan Rangka: Stainless Steel Heavy-Duty Anti-Karat Beban Hingga 120 kg',
      'Roda Belakang: Velg Jari-jari Solid Ban Karet Anti-Bocor (Diameter 24")',
      'Dudukan: Jok Kulit Sintetis Breathable Anti-Air Mudah Disterilisasi',
      'Fitur Lipat: Mekanisme X-Frame Cepat Masuk Bagasi Ambulans',
      'Pijakan Kaki: Aluminium Alloy Footplate Dapat Dilipat & Diputar'
    ]
  },
  {
    id: 10,
    kode_alat: 'ALK-USG-10',
    nama_alat: 'Mesin Ultrasonografi (USG) 4D Color Doppler Digital',
    nama_alkes: 'Mesin Ultrasonografi (USG) 4D Color Doppler Digital',
    kategori: 'Alat Diagnostik',
    stok: 2,
    status: 'Stok Terbatas',
    lokasi_lab: 'Lab Radiologi & Kebidanan (Obgyn)',
    deskripsi: 'Sistem sonografi canggih resolusi 4D real-time dengan pencitraan vaskular Color Doppler dan dukungan algoritma reduksi derau speckle.',
    gambar: '/images/alkes/usg-4d.jpg',
    fallbackGambar: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
    kemenkes_akl: 'KEMENKES RI AKL 21501021480',
    harga_estimasi: 'Rp 280.000.000',
    garansi: '3 Tahun Servis + Free Upgrade Software',
    is_featured: true,
    spesifikasi: [
      'Display: Layar Medis LED 21.5-inch Articulating Arm + 13.3" Touch Panel',
      'Transduser Termasuk: Probe Convex 3.5MHz, Linear 7.5MHz, & Transvaginal 4D',
      'Fitur AI: Auto Fetal Biometry (BPD, HC, AC, FL) & Auto IMT Pengukuran Vaskular',
      'Format Output: DICOM 3.0, Video Rekam MP4, Export USB 3.0 / Cloud PACS',
      'Pencitraan Lanjut: Elastografi Jaringan, 3D/4D Live Surface Render'
    ]
  },
  {
    id: 11,
    kode_alat: 'ALK-MIC-11',
    nama_alat: 'Mikroskop Laboratorium Binokuler Elektrik LED High-Res',
    nama_alkes: 'Mikroskop Laboratorium Binokuler Elektrik LED High-Res',
    kategori: 'Laboratorium & Rehab',
    stok: 12,
    status: 'Tersedia',
    lokasi_lab: 'Lab Patologi Klinik & Hematologi',
    deskripsi: 'Mikroskop riset biomedis binokuler dengan pencahayaan LED dingin Kohler illumination dan lensa objektif akromatik perbesaran hingga 1600x.',
    gambar: '/images/alkes/mikroskop.jpg',
    fallbackGambar: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=80',
    kemenkes_akl: 'KEMENKES RI AKL 10203810190',
    harga_estimasi: 'Rp 8.900.000',
    garansi: '2 Tahun Optik & Mekanikal',
    is_featured: false,
    spesifikasi: [
      'Rentang Perbesaran: 40x, 100x, 400x, 1000x, hingga 1600x Oil Immersion',
      'Lensa Objektif: Plan Achromatic Anti-Jamur & Anti-Refleksi Lapisan Khusus',
      'Sumber Cahaya: LED Dingin 3W Intensitas Kontinu dengan Kondensor Abbe 1.25',
      'Meja Objek: Mechanical Stage Ganda 140x132 mm dengan Skala Vernier',
      'Head View: Siedentopf Binocular Head 30° Miring dan Dapat Diputar 360°'
    ]
  },
  {
    id: 12,
    kode_alat: 'ALK-SUC-12',
    nama_alat: 'Medical Suction Unit Portable High Vacuum Aspirator',
    nama_alkes: 'Medical Suction Unit Portable High Vacuum Aspirator',
    kategori: 'Bedah & Gawat Darurat',
    stok: 7,
    status: 'Tersedia',
    lokasi_lab: 'Lab Kamar Operasi (OK) & IGD',
    deskripsi: 'Pompa hisap cairan medis bervakum tinggi untuk aspirasi darah, dahak, dan mukus selama tindakan bedah darurat dengan botol anti-pecah.',
    gambar: '/images/alkes/suction-pump.jpg',
    fallbackGambar: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
    kemenkes_akl: 'KEMENKES RI AKL 20403813920',
    harga_estimasi: 'Rp 6.750.000',
    garansi: '2 Tahun Kompresor',
    is_featured: false,
    spesifikasi: [
      'Daya Hisap: Vakum Maksimal ≥ 0.09 MPa (680 mmHg) Bebas Oli',
      'Laju Aliran Udara: Kapasitas Debit Tinggi ≥ 32 Liter/Menit',
      'Tabung Penampung: 2x 2.500 ml Bahan Polycarbonate Tahan Autoclave',
      'Fitur Pengaman: Katup Pelampung Anti-Meluap Mencegah Masuk Kompresor',
      'Foot Switch: Disertai Pedal Kaki Untuk Pengoperasian Steril Dokter Bedah'
    ]
  }
]
