/**
 * ============================================================================
 * DATA ARTIKEL BLOG ALKES & WADAH EDUKASI MEDIS
 * ============================================================================
 * PANDUAN MENGGANTI FOTO ARTIKEL DENGAN FOTO SENDIRI:
 * 1. Simpan foto di folder: public/images/blog/ (contoh: kalibrasi.jpg)
 * 2. Ganti nilai `gambar` dengan path lokal: '/images/blog/kalibrasi.jpg'
 * 3. Jika belum diisi, otomatis menggunakan `fallbackGambar` (Unsplash)
 * ============================================================================
 */

export interface BlogArticle {
  id: number
  judul: string
  kategori: 'Regulasi & Standar' | 'Teknologi Medis' | 'Manajemen Faskes' | 'Tips Pemeliharaan' | 'Kegawatdaruratan'
  penulis: {
    nama: string
    gelar: string
    avatar: string
  }
  tanggal: string
  waktuBaca: string
  gambar: string
  fallbackGambar: string
  ringkasan: string
  isiLengkap: string[]
  poinKunci: string[]
  tags: string[]
}

export const blogArticles: BlogArticle[] = [
  {
    id: 1,
    judul: 'Panduan Prosedur Kalibrasi Alat Kesehatan Rumah Sakit Sesuai Standar BPFK & Kemenkes RI',
    kategori: 'Regulasi & Standar',
    penulis: {
      nama: 'Ir. Bambang Triputra, S.T., M.T.',
      gelar: 'Spesialis Kalibrasi Elektromedis Senior',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
    },
    tanggal: '22 Oktober 2026',
    waktuBaca: '6 Menit Baca',
    gambar: '/images/blog/kalibrasi-bpfk.png',
    fallbackGambar: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
    ringkasan: 'Kalibrasi berkala adalah pilar utama keselamatan pasien (patient safety) dan prasyarat mutlak akreditasi KARS / Kemenkes bagi setiap instrumen medis.',
    tags: ['Kalibrasi Medis', 'BPFK', 'Standar Kemenkes', 'Patient Safety'],
    poinKunci: [
      'Alat diagnostik dan live-saving wajib dikalibrasi minimal 1 kali setiap tahun.',
      'Pengujian mencakup uji fungsi mekanik, keamanan kelistrikan (electrical safety test), dan uji akurasi parameter.',
      'Sertifikat kelayakan kalibrasi berlaku resmi jika diterbitkan oleh balai berizin BPFK atau institusi terakreditasi KAN.'
    ],
    isiLengkap: [
      'Dalam operasional fasilitas pelayanan kesehatan modern, presisi pembacaan alat elektromedis berbanding lurus dengan ketepatan diagnosis dokter. Sedikit deviasi pada alat seperti defibrillator, ventilator, atau elektrokardiograf dapat berakibat fatal bagi pasien.',
      'Kementerian Kesehatan Republik Indonesia melalui Peraturan Menteri Kesehatan telah mengatur secara ketat kewajiban pengujian dan kalibrasi alat kesehatan secara berkala. Kalibrasi bukan sekadar formalitas dokumen administratif pengajuan akreditasi, melainkan wujud nyata implementasi budaya keselamatan pasien.',
      'Setiap proses kalibrasi harus melalui empat tahapan utama: inspeksi fisik eksternal, pengukuran arus bocor isolasi (uji keamanan kelistrikan sesuai standar IEC 60601), verifikasi kurva respon sensorik menggunakan alat ukur terkalibrasi internasional, dan penerbitan stiker laik pakai dengan masa berlaku tertera jelas.',
      'Fasilitas kesehatan yang konsisten melakukan kalibrasi terbukti menekan angka kerusakan mendadak (downtime) hingga 65% serta memperpanjang usia pakai aset peralatan medis bernilai miliaran rupiah.'
    ]
  },
  {
    id: 2,
    judul: 'Inovasi USG 4D Berbasis Kecerdasan Buatan (AI) di Era Pemeriksaan Diagnostik Fetal',
    kategori: 'Teknologi Medis',
    penulis: {
      nama: 'dr. Kevin Pratama, Sp.Rad',
      gelar: 'Konsultan Radiologi & Pencitraan Medis',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&h=150&q=80'
    },
    tanggal: '18 Oktober 2026',
    waktuBaca: '5 Menit Baca',
    gambar: '/images/blog/usg-ai.jpg',
    fallbackGambar: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
    ringkasan: 'Pemanfaatan machine learning dalam rekonstruksi citra sonografi mempercepat identifikasi anomali kongenital janin dan vaskular dengan akurasi 40% lebih tinggi.',
    tags: ['USG 4D', 'AI Medis', 'Radiologi', 'Kandungan'],
    poinKunci: [
      'Algoritma rekonstruksi citra mampu memisahkan bayangan artefak cairan amnion secara instan.',
      'Fitur Auto-Biometry menghitung lingkar kepala (HC) dan panjang femur (FL) otomatis dalam 1 klik.',
      'Membantu sonografer mendeteksi kelainan jantung bawaan lebih dini pada trimester kedua.'
    ],
    isiLengkap: [
      'Pemeriksaan ultrasonografi telah bertransformasi dari sekadar gambar dua dimensi monokrom menjadi model visual empat dimensi dengan kedalaman bayangan hiper-realistis. Kehadiran teknologi AI semakin memperkuat keandalan klinis sonografi modern.',
      'Dengan bantuan neural network yang dilatih dari jutaan database sonogram tervalidasi, mesin USG modern dapat secara otomatis mengoreksi sudut datang berkas gelombang suara, menstabilkan getaran mikro transduser, dan menampilkan kontur wajah atau organ dalam janin secara dramatis.',
      'Bagi para dokter spesialis kandungan dan radiologi, inovasi ini menghemat waktu scanning hingga 35%, memungkinkan dokter mencurahkan lebih banyak waktu untuk berkomunikasi dan menjelaskan hasil diagnosis secara empati kepada pasien.'
    ]
  },
  {
    id: 3,
    judul: 'Standar Emas Sterilisasi Autoclave untuk Perlengkapan Bedah & Kamar Operasi',
    kategori: 'Manajemen Faskes',
    penulis: {
      nama: 'Ns. Sarah Amelia, S.Kep, M.Kep',
      gelar: 'Koordinator Pencegahan & Pengendalian Infeksi (PPI)',
      avatar: 'https://images.unsplash.com/photo-1594824813511-2856238b7d48?auto=format&fit=crop&w=150&h=150&q=80'
    },
    tanggal: '14 Oktober 2026',
    waktuBaca: '4 Menit Baca',
    gambar: '/images/blog/autoclave-steril.png',
    fallbackGambar: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=900&q=80',
    ringkasan: 'Protokol eliminasi infeksi nosokomial (HAIs) menuntut verifikasi biologis dan kimiawi ketat pada setiap siklus sterilisasi uap bertekanan.',
    tags: ['Sterilisasi', 'Autoclave', 'Kamar Operasi', 'PPI RS'],
    poinKunci: [
      'Suhu 121°C selama 30 menit atau 134°C selama 4-5 menit adalah standar siklus pemusnahan spora.',
      'Wajib menggunakan indikator biologis Geobacillus stearothermophilus secara berkala.',
      'Penyimpanan instrumen steril harus di ruang bertekanan positif dengan kelembapan terkontrol < 60%.'
    ],
    isiLengkap: [
      'Infeksi daerah operasi (IDO) masih menjadi salah satu ancaman komplikasi pasca-bedah paling serius di fasilitas kesehatan di seluruh dunia. Salah satu kunci pencegahan paling mendasar berakar pada unit Central Sterile Supply Department (CSSD).',
      'Metode sterilisasi uap panas bertekanan tinggi (Autoclave) tetap menjadi gold standard karena sifatnya yang non-toksik, efektif mematikan spora bakteri terkuat, dan ekonomis. Namun, kesalahan pemuatan kantong sterilisasi (overloading) kerap menghambat sirkulasi uap.',
      'Manajemen faskes harus menerapkan checklist 3 lapis: indikator fisik (tekanan & suhu terukur pada manometer), indikator kimiawi (perubahan warna strip pita autoclave), dan indikator biologis yang ditumbuhkan dalam inkubator untuk membuktikan steril 100% sebelum alat dipakai ke tubuh pasien.'
    ]
  },
  {
    id: 4,
    judul: 'Urgensi Penyediaan Automated External Defibrillator (AED) di Faskes & Tempat Publik',
    kategori: 'Kegawatdaruratan',
    penulis: {
      nama: 'dr. Ratna Dewi, Sp.JP (K)',
      gelar: 'Dokter Spesialis Jantung & Pembuluh Darah',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&h=150&q=80'
    },
    tanggal: '09 Oktober 2026',
    waktuBaca: '7 Menit Baca',
    gambar: '/images/blog/aed-emergency.jpg',
    fallbackGambar: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=80',
    ringkasan: 'Setiap menit penundaan kejut defibrilasi menurunkan peluang bertahan hidup penderita henti jantung mendadak (SCA) sebesar 7% hingga 10%.',
    tags: ['AED', 'Henti Jantung', 'Emergency', 'CPR Resusitasi'],
    poinKunci: [
      'Periode emas (golden period) defibrilasi adalah dalam 3 hingga 5 menit pertama pasca kolaps.',
      'AED generasi modern dirancang aman tanpa resiko salah kejut pada irama jantung normal.',
      'Panduan audio interaktif memandu penolong awam melakukan RJP berkualitas secara tenang.'
    ],
    isiLengkap: [
      'Henti jantung mendadak (Sudden Cardiac Arrest) dapat menyerang siapa saja tanpa memandang usia atau riwayat penyakit sebelumnya. Sebagian besar kasus disebabkan oleh irama fibrilasi ventrikel yang hanya dapat diatasi melalui kejutan listrik terkoordinasi.',
      'Keberadaan unit Automated External Defibrillator (AED) di lobi rumah sakit, puskesmas, klinik pratama, bandara, dan pusat keramaian telah menjadi standar keselamatan di berbagai negara maju. Di Indonesia, kesadaran ini mulai tumbuh pesat.',
      'AED pintar Anisa Medika Lifeguard dilengkapi chip analisa ritme jantung otomatis, elektroda pra-terpasang, dan instruksi suara berbahasa Indonesia yang memandu penolong mulai dari penempatan bantalan elektroda hingga hitungan kompresi dada secara presisi.'
    ]
  },
  {
    id: 5,
    judul: 'Tips Praktis Merawat Pulse Oximeter & Tensimeter Digital Agar Tetap Presisi Bertahun-tahun',
    kategori: 'Tips Pemeliharaan',
    penulis: {
      nama: 'Ahmad Zaki, Amd.TEM',
      gelar: 'Teknisi Biomedik & Logistik Alkes',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80'
    },
    tanggal: '03 Oktober 2026',
    waktuBaca: '5 Menit Baca',
    gambar: '/images/blog/maintenance-alkes.jpg',
    fallbackGambar: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=900&q=80',
    ringkasan: 'Langkah sederhana pembersihan sensor optik, perawatan baterai alkalin, dan pengecekan kebocoran selang udara untuk memperpanjang usia alat.',
    tags: ['Maintenance', 'Tensimeter', 'Oximeter', 'Tips Nakes'],
    poinKunci: [
      'Bersihkan lensa photodiode oximeter dengan alkohol 70% kering, hindari cairan merembes.',
      'Lepaskan baterai saat alat tidak digunakan lebih dari 1 minggu untuk mencegah korosi asam.',
      'Jangan menekuk atau melipat selang manset tensimeter secara tajam karena memicu retakan mikro.'
    ],
    isiLengkap: [
      'Alat diagnostik portabel seperti tensimeter digital dan pulse oximeter adalah instrumen paling sering digunakan oleh perawat dan tenaga medis. Penggunaan berulang tanpa perawatan tepat sering memicu pembacaan error atau deviasi angka.',
      'Sumber kesalahan umum pada oximeter adalah akumulasi debu atau sisa alkohol gel pada jendela sensor inframerah di dalam klip jari. Pembersihan rutin dengan kapas lembut yang dibasahi isopropil alkohol 70% akan menjaga transmitansi cahaya tetap optimal.',
      'Untuk tensimeter digital, kebocoran udara halus pada konektor selang manset adalah penyebab nomor satu error pengisian kompresor. Pastikan manset digulung longgar saat penyimpanan dan lakukan verifikasi nol (zero-point check) secara berkala.'
    ]
  },
  {
    id: 6,
    judul: 'Masa Depan Telemetri Pasien: Integrasi Sensor Nirkabel dengan Rekam Medis Elektronik (RME)',
    kategori: 'Teknologi Medis',
    penulis: {
      nama: 'dr. Ilham Ramadhan, Sp.An-TI',
      gelar: 'Konsultan Terapi Intensif & Informatika Kedokteran',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80'
    },
    tanggal: '28 September 2026',
    waktuBaca: '6 Menit Baca',
    gambar: '/images/blog/telemetri-rme.png',
    fallbackGambar: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=80',
    ringkasan: 'Transformasi digital faskes menuju SatuSehat mewajibkan transfer data tanda vital pasien secara nirkabel langsung ke sistem SIMRS tanpa pencatatan manual.',
    tags: ['Telemetri', 'RME', 'SatuSehat', 'Smart Hospital'],
    poinKunci: [
      'Mengeliminasi kesalahan input data manual perawat (transcription error) hingga 99%.',
      'Early Warning Score (EWS) terhitung otomatis dan membunyikan peringatan dini ke ruang jaga.',
      'Mendukung mobilitas pasien rawat inap tanpa terbelit kabel monitor stasioner konvensional.'
    ],
    isiLengkap: [
      'Era pencatatan tanda vital pasien menggunakan lembaran kertas kurva suhu dan tensi perlahan ditinggalkan. Rumah sakit modern kini bertransisi mengadopsi ekosistem Smart Hospital terintegrasi protokol HL7 dan FHIR.',
      'Dengan patient monitor bedside dan patch telemetri wearable yang terhubung ke jaringan Wi-Fi rumah sakit yang aman, denyut jantung, saturasi oksigen, dan tekanan darah pasien dipantau 24 jam secara non-invasif.',
      'Bila terjadi perburukan mendadak pada tanda vital pasien, sistem EWS otomatis mengirimkan notifikasi prioritas tinggi ke tablet dokter jaga dan perawat, sehingga penanganan medis darurat dapat diberikan dalam hitungan menit sebelum terjadi syok atau kolaps.'
    ]
  }
]
