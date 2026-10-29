# Laporan Short 02: Kenapa bunga flat kelihatan murah (3D v1)

Status: selesai. Video akhir ada di `FINAL OUTPUT/30 Oktober 2026/Kenapa bunga flat kelihatan murah (3D v1).mp4` (89,4 detik, 1080x1920, 30 fps).

## 0. Akseptasi

| # | Poin | Hasil |
|---|---|---|
| 1 | Teks VO di data sama dengan skrip, file AUDIO tidak berubah | LOLOS. 199 kata dari skrip, 0 kata gagal dipetakan. MP3 tetap 1.435.908 byte, md5 sama, tanggal tidak berubah |
| 2 | verifySync | LOLOS. 0 % pelanggaran awal halaman, median 0 ms dan p95 20 ms setelah render, start_time 0 dan 0 |
| 3 | Subtitle tidak pernah hilang saat ada suara, label tidak menutupi subtitle atau karakter | LOLOS. 0 frame bersuara tanpa caption. Label di 15 % atas, caption berakhir di 71,5 % |
| 4 | Tidak ada flicker menonjol | LOLOS untuk tes statis (0 di 9 scene). Tes kamera bergerak ditinjau manual, 1 z-fighting nyata ditemukan dan diperbaiki |
| 5 | Karakter bereaksi, 3 lapisan kedalaman, 2 gerakan kamera, tidak diam lebih dari 0,8 detik | LOLOS. Kamera bergerak di setiap frame, karakter selalu idle (napas, kedip, lirik) |
| 6 | Gaya 3D stylized berkualitas | LOLOS dengan catatan jujur di bagian 1 |
| 7 | Angka di layar dari finance.ts, tinggi objek ikut data, tanpa logo | LOLOS. checkFinance semua lolos, tidak ada merek atau logo |
| 8 | Kartu judul S1 dan end card "Noel Menjawab" | LOLOS. Kartu judul sejak frame 0 sampai akhir S1, end card turun di "Noel Menjawab" (2 detik terakhir) |
| 9 | MP4 90 detik atau kurang, ada suara, hasil lama tidak berubah | LOLOS. 89,4 detik, AAC stereo, mean -21,9 dB. Folder FINAL OUTPUT sebelumnya kosong |

## 1. Lima poin gaya dari referensi

Dari 9 referensi yang disebut di prompt, yang sampai ke sesi ini hanya satu video, yaitu "Kenapa Genteng Bisa Bocor Padahal Nggak Pecah" (howcomeid). File lain yang diunggah adalah audio septic tank, bukan video, jadi tidak dipakai sebagai referensi.

| Poin gaya di referensi | Penerapan di Short 02 |
|---|---|
| Maket berpenampang: bangunan berdiri di atas balok tanah yang lapisannya kelihatan | Balok tanah penampang di S6 (rumput, tanah atas, tanah, tanah dalam, batu, akar), papan FLAT dan EFEKTIF berdiri di atasnya |
| Dunia kampung rapat dan berlapis: langit berawan, kelapa, tiang listrik berkabel, rumah genteng, gunung berkabut | 3 baris rumah utara dan 2 baris selatan, warung, bengkel, kelapa, pisang, pohon, kabel melengkung, lampu jalan, pagar, motor, kursi plastik, 2 lapis gunung berkabut, awan lembut |
| Material terbaca dari dekat: genteng, bata, kayu | Tekstur prosedural genteng dan bata dengan normal map, kayu, plester, aspal retak, UV berskala dunia, close-up kalkulator, papan, toples, timbangan |
| Teks pendek dan potongan cepat | Caption maksimal 4 kata dan 24 karakter, kamera selalu bergerak (minimal 2 gerakan per scene), whip pan dan Tuti melintas sebagai transisi |
| Tokoh kecil sebagai pembawa cerita, cahaya ikut cerita (cerah, mendung, sore) | Pak Dodi dan Tuti dengan 8 ekspresi, mood pagi S1 sampai S4, redup S5, hangat S6, keemasan S7 sampai S9 |

Uji kualitas (jujur): hasilnya bersih, rapi, dan konsisten, dengan material berkarakter, bayangan lembut, dan dunia berlapis. Tidak terlihat seperti prototipe atau blok polos. Tapi ini 3D stylized ala mainan atau maket, belum serealis render Blender howcomeid yang memakai tekstur foto dan global illumination. Bagian yang masih terasa sederhana adalah bidang rumput yang luas dan pohon latar yang bulat.

## 2. Ringkasan perubahan per masalah

**Konteks.** Repo NoelNoel12/ytshort masih kosong, jadi project REMOTION-3D Short 01 tidak tersedia di sesi ini. Pipeline, dunia, karakter, dan properti dibangun ulang dari nol dengan struktur folder ROOT yang sama, dan sudah siap dipakai untuk Short berikutnya lewat `data/videos.ts`.

**Flat dan kualitas visual**
- Semua bentuk bulat memakai segmen cukup, kotak memakai bevel, kanopi memakai icosphere yang dideformasi dengan normal halus.
- Genteng dan bata punya peta warna dan normal map prosedural, UV berskala dunia supaya kepadatan detail sama di semua ukuran rumah.
- AO palsu di kaki dinding dan bayangan kontak di bawah karakter dan properti, gunung berkabut dengan gradasi vertex, environment map hangat khusus untuk emas dan koin.

**Flicker (4 bug nyata ditemukan dan diperbaiki)**
- Nat bata dan celah genteng terlalu tipis (sekitar 2 px di dinding jauh) sehingga berkilau. Bata dan genteng diperbesar, kontras nat diturunkan.
- Bayangan PCF bawaan three r186 memutar sampling per piksel dengan noise (bintik dither halus yang merayap). Shader di-patch menjadi grid 3x3 tetap (`src/world/shaderPatches.ts`), normal bias dinaikkan.
- Frame pertama di setiap tab render menggambar dunia dua kali sebelum batching selesai, overlay AO jadi lebih gelap satu frame. Di video ini akan muncul sebagai kedipan di tiap batas potongan render. Diperbaiki (grup sumber langsung disembunyikan, frame pertama ditahan dengan delayRender).
- Dasar kaca toples (dua sisi) sejajar dengan aspal sehingga z-fighting. Dasar diangkat 2 cm.
- Tetap berlaku: tekstur dibuat sekali dan di-cache, mipmap dan anisotropy 8, kamera bayangan tetap per scene, marka jalan berupa geometri 22 cm, offset ketinggian antar lapisan, semua acak memakai seed.

**Animasi**
- Preset spring bernama di `src/anim.ts` (snappy, bouncy, heavy, soft, wobble), antisipasi, squash 1,15 x 0,8 selama 3 frame, punch-in 1,08 dalam 3 frame, getaran kamera berseed.
- Follow-through helm, napas, kedip deterministik, lirikan kepala, Tuti mengangguk ala merpati. Partikel debu, bulu, koin semuanya deterministik.
- 26 aksi dari skrip dipicu tepat di kata pemicunya (selisih maksimal 15 ms).

**Subtitle, label, kartu judul**
- Tiga lapisan terpisah. Caption tidak pernah disembunyikan, HOLD 600 ms dihapus, muncul 2 sampai 35 ms sebelum kata, hilang maksimal 150 ms setelah kata terakhir.
- Timing: whisper dipetakan ke ejaan skrip lewat alignment per karakter (menangani "12%" lawan "dua belas persen" dan "ke enam" lawan "keenam"), lalu disnap ke silencedetect.
- Frasa angka tidak pernah terpotong di dua halaman. Angka di label dan papan 3D dirender dari `finance.ts`.

**Performa (render 1,92 menjadi 1,04 detik per frame)**
- Profil menunjukkan fill rate yang jadi bottleneck. Environment map di semua permukaan memakan sekitar 0,9 detik per frame, jadi IBL dibatasi ke material yang memantul, hemisphere light dinaikkan sebagai kompensasi.
- Static batching dunia kampung, poligon latar jauh dikurangi. Anti alias dan bayangan dipertahankan.

## 3. Hasil verifikasi

**verifySync**

| Cek | Hasil | Batas | Status |
|---|---|---|---|
| Awal halaman caption di batas jeda (39 halaman) | 0 pelanggaran (0 %), selisih -35 sampai +0 ms | -80 sampai +40 ms, maks 5 % | LOLOS |
| Akhir halaman sebelum jeda (39 halaman) | 0 pelanggaran, +117 sampai +150 ms setelah suara berhenti | maks 250 ms | LOLOS |
| Frame bersuara tanpa caption | 0 | 0 | LOLOS |
| Pemicu aksi (26) | semua terhubung ke scene, selisih maks 15 ms | 100 ms | LOLOS |
| start_time video dan audio di MP4 | 0 dan 0 | 0 | LOLOS |
| Selisih durasi video dan audio | 8 ms | 50 ms | LOLOS |
| Waktu kata hasil transkripsi ulang MP4 vs caption (whisper + snap) | median 0 ms, p95 20 ms | median < 80, p95 < 200 | LOLOS |
| Sama, dibanding frame saat kata berubah kuning di layar | median 20 ms, p95 40 ms | median < 80, p95 < 200 | LOLOS |
| Whisper mentah tanpa snap (informasi) | median 0 ms, p95 99 ms | | |
| Cek visual 10 titik tengah kata acak langsung dari MP4 | 10 dari 10 menampilkan kata yang diucapkan, berwarna kuning | | LOLOS |

**checkFlicker** (10 frame berurutan per scene, resolusi penuh)

| Mode | Isi | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| static | kamera dan isi dibekukan, blok yang berubah | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | LOLOS |
| moving | isi dibekukan, kamera bergerak, blok berosilasi | 54 | 6 | 175 | 0 | 0 | 0 | 0 | 0 | 0 | ditinjau |

Blok "moving" di S1, S2, S3 sudah aku periksa dengan crop 200 % pada 8 frame berurutan: semuanya paralaks pola berulang yang tipis (tombol kalkulator, helai rumput, dua tiang kotak kaca), bukan shimmer atau z-fighting. Satu z-fighting nyata (dasar toples di S4 dan S9) ditemukan oleh tes ini dan sudah diperbaiki, setelahnya S4 dan S9 menjadi 0.

**checkFinance**: semua lolos. Pokok 1.000.000, bunga 120.000, cicilan 1.120.000, total bunga 1.440.000, sisa utang bulan ke-6 6.000.000, bunga efektif 1,7881 % per bulan atau 21,457 % per tahun, rasio 1,788 (hampir 2x lipat), angka VO dan angka layar cocok.

**File audio**: `AUDIO/30 Oktober 2026/Bunga Flat.mp3` tidak berubah (1.435.908 byte, md5 2cd3984e55fc042cf5b0a730a2138936). VO 88,686 detik, di bawah 89,5 detik, jadi jeda tidak diubah.

**MP4 akhir**: `FINAL OUTPUT/30 Oktober 2026/Kenapa bunga flat kelihatan murah (3D v1).mp4`, 1080x1920, 30 fps, H.264 CRF 17 dan AAC 192 kbps, 89,4 detik, 97,4 MB, audio terdengar (mean -21,9 dB).

## 4. File yang dibuat

- ROOT: `.gitignore`, `README.md`, salinan `skrip-short-02-bunga-flat.md` dan `prompt-claude-code-remotion-02.md`
- `REMOTION-3D/`: `package.json`, `tsconfig.json`, `remotion.config.ts`, `README.md`, laporan ini
- `data/`: `videos.ts`, `short-02.script.json`, `short-02.audio.json`, `short-02.whisper.json`, `short-02.words.json`, `short-02.timeline.json`
- `scripts/`: `paths.ts`, `data.ts`, `prepareAudio.ts`, `transcribe.ts`, `parseScript.ts`, `refineCaptions.ts`, `alignScenes.ts`, `lib/align.ts`, `checkFinance.ts`, `verifySync.ts`, `checkFlicker.ts`, `stills.ts`, `bench.ts`, `renderAll.ts`
- `src/`: `index.ts`, `Root.tsx`, `theme.ts`, `anim.ts`, `finance.ts`, `types.ts`, `timeline.ts`, `fonts.tsx`, `lib/text.ts`, `components/` (TextLayers, Grade), `compositions/` (Short02, WorldTest, CharacterTest, PropsTest), `scenes/` (SceneWorld, types, `short02/S1` sampai `S9`, layout), `world/` (materials, textures, geom, noise, Lighting, Sky, Ground, buildings, nature, street, Kampung, StaticBatch, CameraRig, shaderPatches, `characters/` PakDodi, Tuti, rig, `props/` desk, boards, money, misc, text, styles)
- `tools/transcribe.py`, `public/fonts/` (Plus Jakarta Sans dan Baloo 2, lisensi OFL)

## 5. Perintah

```
cd REMOTION-3D
npm install
npm run dev
npm run data
npm run verify
npm run check:flicker
npm run still:check
npm run render:preview
npm run render:one
```

## 6. Waktu render

- Final 1080x1920: 51 menit untuk 2.682 frame (sekitar 1,1 detik per frame) di container 4 core tanpa GPU (SwiftShader).
- Di komputer Windows dengan GPU (`REMOTION_GL=angle`) seharusnya jauh lebih cepat, belum diuji.

## 7. Asumsi yang aku ambil

- Repo kosong, jadi project dibangun dari nol. Data Short 01 tidak ada untuk dijaga atau dipakai ulang.
- HuggingFace diblok, jadi model medium tidak bisa diunduh. Dipakai Whisper small (CTranslate2 int8) dari paket npm pihak ketiga `@skillninja/shortmovie-telop-model-p0` sampai `p3` (hanya file data, tanpa script install, checksum cocok dengan yang disertakan). Kualitas timing tetap lolos semua batas setelah snap silencedetect.
- Teks layar S1 dipakai sebagai kartu judul, chip "Noel Menjawab" di S9 dipakai sebagai end card, bukan label.
- Label S3 "Cicilan tetap" ditambatkan ke "Cicilannya sama terus" dan label S7 "Jangan bandingin flat vs efektif" ke "dibandingin langsung", karena kata berbintangnya tidak diucapkan atau baru diucapkan di akhir scene.
- Caption memakai ejaan skrip, tanda koma dan titik tidak ditampilkan (gaya referensi).
- Kalender memakai nama bulan (JAN sampai DES) supaya tidak ada angka lain di layar selain yang diizinkan.
- Balok bunga dilebihkan 1,6x secara visual, konsisten di semua bulan.
- Kartu judul sedikit masuk ke 20 % bawah (pita 72,8 sampai 85,8 %) karena prompt meminta pita di bawah sementara caption ada di 62 sampai 72 %.
- `render:one` tidak pernah menimpa: kalau nama sudah ada, nomor versi naik otomatis. File v1 akhir adalah render kedua dari sesi ini (perbaikan kaki Tuti saat transisi, timbangan S7 tidak tertutup tiang, balon komentar S9 lebih besar). Render pertama di sesi yang sama aku ganti dan tidak ada hasil lama lain di folder itu.

## 8. Yang belum bisa diuji

- Render di Windows dengan GPU dan Remotion Studio interaktif (container ini headless).
- Perbandingan Whisper medium.
- Referensi (1) sampai (9) selain video genteng, karena tidak terunggah.
