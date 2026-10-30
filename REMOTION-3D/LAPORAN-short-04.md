# Laporan Short 04: Kenapa sinyal HP hilang di lift (3D v1)

Status: selesai. Video akhir ada di `FINAL OUTPUT/30 Oktober 2026/Kenapa sinyal HP hilang di lift (3D v1).mp4` (83,7 detik, 1080x1920, 30 fps).

## 0. Akseptasi

| # | Poin | Hasil |
|---|---|---|
| 1 | Teks VO di data sama dengan skrip, file AUDIO tidak berubah | LOLOS. 184 kata dari skrip, 184 terpetakan, 0 gagal. `AUDIO/30 Oktober 2026/Sinyal Lift.mp3` identik dengan file yang diunggah (1.342.285 byte, md5 6a74ded59fb8687f6b9de9f90db0793a) |
| 2 | verifySync | LOLOS. 0 % pelanggaran awal dan akhir halaman, 27 dari 27 pemicu aksi tepat, median 0 ms dan p95 20 ms setelah render, start_time 0 dan 0, offset VO di mix 0 ms |
| 3 | Aturan baru 1: subtitle tidak menutupi aksi utama | LOLOS. checkTextOverlap memeriksa 66 halaman caption di setiap frame terhadap aksi utama, kartu judul, label, dan end card. Hasilnya 0 halaman menyentuh |
| 4 | Aturan baru 2: tidak ada kotak hitam di belakang judul dan subtitle, judul tetap terbaca | LOLOS. Gaya "clean": teks putih dan kuning dengan outline gelap 13 sampai 16 px dan bayangan lembut, tanpa pita, kotak, atau latar apa pun |
| 5 | Aturan baru 3: sound effect | LOLOS. 74 cue dari 24 efek, semuanya terdengar di hasil render, tidak ada yang menutupi narasi |
| 6 | Tidak ada flicker menonjol | LOLOS untuk tes statis (0 di 9 scene). Tes kamera bergerak ditinjau manual, tidak ada z-fighting atau shimmer yang ditemukan |
| 7 | Tanpa angka di layar, HP, menara, dan lift generik tanpa logo | LOLOS. checkFinance mode "none": 22 chip teks diperiksa, 0 angka. Tidak ada merek atau logo |
| 8 | Kartu judul S1 dan end card "Noel Menjawab" | LOLOS. Judul di atas sejak frame 0 sampai akhir S1, end card turun di kata "Noel Menjawab" |
| 9 | MP4 90 detik atau kurang, ada suara, hasil lama tidak berubah | LOLOS. 83,7 detik, AAC stereo, mean -21,6 dB, puncak -4,5 dB. File Short 02 di folder yang sama tidak tersentuh (97.446.893 byte, tanggal 29 Oktober) |

## 1. Lima poin gaya dari referensi

Referensi yang tersedia tetap satu video, "Kenapa Genteng Bisa Bocor Padahal Nggak Pecah" (howcomeid). Lima poinnya sama dengan Short 02, penerapannya di Short 04 seperti ini.

| Poin gaya di referensi | Penerapan di Short 04 |
|---|---|
| Maket berpenampang | Gedung 5 lantai yang bagian depannya dipotong, jadi poros lift, lobi, kantor, ruang mesin, dan tangki di atap kelihatan sekaligus. Kabin bisa berubah jadi sangkar kisi tembus pandang |
| Dunia kampung rapat dan berlapis | Kampung dari Short 02 dipakai ulang (varian short04) dengan gedung dan menara sinyal kisi generik, kabel, rumah genteng, pohon, gunung berkabut |
| Material terbaca dari dekat | Baja kabin mengilap dengan pantulan lingkungan, kisi sangkar, papan kayu dengan huruf timbul, kabel oranye, antena, booster dengan LED berkedip |
| Teks pendek dan potongan cepat | Caption maksimal 4 kata dan 24 karakter, whip pan dan Tuti melintas sebagai transisi, kamera selalu bergerak |
| Tokoh kecil sebagai pembawa cerita, cahaya ikut cerita | Pak Dodi menelepon di lift, Tuti menangkis cincin sinyal dan pura-pura jadi hantu. Mood pagi di S1 sampai S3, redup di S4 (sangkar), pagi lagi di S5 (solusi), keemasan di S6, S7, S9, hangat di S8 |

Uji kualitas (jujur): hasilnya rapi dan konsisten dengan Short 02. Gelombang sinyal digambar sebagai cincin transparan dan muatan sebagai bola bercahaya, sesuai catatan skrip. Bagian yang masih terasa sederhana adalah dinding gedung maket mini di S7 yang polos dan cincin sinyal di S1 yang terlihat dari samping sehingga tampak seperti garis tipis.

## 2. Ringkasan perubahan per aturan baru

**Aturan 1: subtitle tidak boleh menutupi aksi utama**
- Setiap scene sekarang mendeklarasikan aksi utamanya per frame sebagai bola atau kotak di dunia 3D: badan Pak Dodi dari lutut sampai helm, HUD sinyal (bar dan ikon telepon), cincin yang sedang terbang, titik tumbukan, papan label 3D, antena, booster, gelembung bicara, dan model sangkar.
- `src/lib/captionPlacement.ts` memproyeksikan volume itu dengan kamera scene di setiap frame halaman caption, lalu memilih pita yang bersih: 71,5 % (bawaan), 80 %, 36 %, atau 27,5 %. Kartu judul, label, dan end card dihitung juga supaya teks tidak saling tumpuk. Dua baris memakai `text-wrap: balance` supaya blok teks lebih sempit.
- Di scene yang tidak punya pita bersih, komposisi kamera diubah. `scripts/fitFraming.ts` mencari kombinasi terkecil antara kamera mundur dan lens shift (gambar digeser naik tanpa memiringkan kamera) per scene. Hasilnya ada di tabel `FRAMING` di `src/scenes/short04/index.ts`.
- Beberapa desain adegan disesuaikan supaya lolos tanpa membuat shot terlalu jauh: HUD sinyal dipindah dari atas kabin ke samping kepala Dodi, gelombang S1 sebelum kotak jatuh masuk ke poros lebih tinggi, papan SANGKAR FARADAY di S4 diturunkan, kabin S6 sekarang pergi meninggalkan antena yang tetap di tempat (kamera berhenti mengikuti kabin), label BAHAN di S7 mengecil saat booster muncul, booster S7 dinaikkan dan memancarkan cincin, gelembung "SEBENTAR YA" di S8 dikecilkan, model sangkar S9 berdiri di atas peti.
- `scripts/checkTextOverlap.ts` memeriksa ulang setiap frame (bukan sampel) dan gagal kalau ada satu saja halaman yang menyentuh.

**Aturan 2: tidak ada kotak hitam di belakang judul dan subtitle**
- Gaya teks baru "clean" di `src/components/TextLayers.tsx`. Judul S1 pindah ke atas (10,5 %), pita gelap di bawah judul dihapus. Label atas dan caption juga tanpa latar.
- Keterbacaan dijaga dengan outline gelap tebal (WebkitTextStroke dengan paint order stroke lalu fill) dan bayangan lembut. Baris kedua judul 104 px kuning dengan outline 16 px.
- Short 02 tetap memakai gaya lama ("chips") supaya hasil lama tidak berubah.

**Aturan 3: sound effect**
- 24 efek dibuat secara prosedural di Node (`scripts/makeSfx.ts`): osilator, filter, noise berseed, reverb sederhana. Tidak ada unduhan dan tidak ada rekaman pihak ketiga, jadi aman dari klaim hak cipta.
- 74 cue ditempel ke aksi yang dipicu kata VO (klang lift jatuh, ding pintu, bar turun, telepon putus, boing cincin memantul, servo antena, zip kabel, gemuruh kabin, hantu dan poof Tuti, centang benar, pop balon komentar) plus whoosh dan kepak sayap di setiap transisi.
- `scripts/mixSfx.ts` menghitung gain per cue. Saat ada narasi, efek diletakkan sekitar 10 dB di bawah VO di jendela yang sama (maksimal -24 dBFS), saat jeda boleh sampai -18 dBFS. Efek yang muncul berdekatan dihitung sebagai satu suara. 52 dari 74 cue diturunkan.

**Hal lain yang ikut diperbaiki**
- Komposisi generik `ShortVideo` dipakai Short 02 dan Short 04, dengan mode audio saja untuk cek mix cepat (sekitar 30 detik).
- Caption dua baris sekarang memakai `text-wrap: balance` di komponen bersama. MP4 Short 02 tidak berubah, tapi kalau Short 02 dirender ulang, pemotongan baris caption-nya akan sedikit lebih seimbang. Komposisi Short 02 sudah aku cek masih bisa dirender.
- verifySync untuk mix dengan SFX: offset VO diukur dengan cross-correlation terhadap file VO, snapping memakai jeda dari VO asli (silencedetect di mix tidak bisa dipercaya karena jeda terisi SFX), dan setiap cue SFX dicek terdengar.

## 3. Hasil verifikasi

**checkTextOverlap** (setiap frame dari 66 halaman)

| Cek | Hasil | Status |
|---|---|---|
| Halaman yang menyentuh aksi utama | 0 dari 66 | LOLOS |
| Halaman yang menyentuh kartu judul, label, atau end card | 0 dari 66 | LOLOS |
| Sebaran pita | 71,5 %: 29 halaman, 80 %: 34 halaman, 36 %: 3 halaman | |

**verifySync**

| Cek | Hasil | Batas | Status |
|---|---|---|---|
| Awal halaman caption di batas jeda (37 dari 66 halaman) | 0 pelanggaran (0 %) | maks 5 % | LOLOS |
| Akhir halaman sebelum jeda (37 halaman) | 0 pelanggaran | maks 250 ms | LOLOS |
| Frame bersuara tanpa caption | 0 | 0 | LOLOS |
| Pemicu aksi (27) | semua terhubung ke scene, selisih maks 13 ms | 100 ms | LOLOS |
| start_time video dan audio di MP4 | 0 dan 0 | 0 | LOLOS |
| Selisih durasi video dan audio | 2 ms | 50 ms | LOLOS |
| Offset VO di dalam mix (cross-correlation dengan file VO) | 0 ms, gain 0,998 | 10 ms | LOLOS |
| Waktu kata hasil transkripsi ulang MP4 vs caption (whisper + snap ke jeda VO) | median 0 ms, p95 20 ms, maks 40 ms | median < 80, p95 < 200 | LOLOS |
| Sama, dibanding frame saat kata berubah kuning di layar | median 20 ms, p95 47 ms, maks 67 ms | median < 80, p95 < 200 | LOLOS |
| Whisper mentah tanpa snap (informasi) | median 0 ms, p95 182 ms, maks 443 ms | | |
| Cek visual 10 titik tengah kata langsung dari MP4 | 10 dari 10 menampilkan kata yang diucapkan, berwarna kuning | | LOLOS |

Catatan cek visual: untuk kata "Pak" (cuma 100 ms atau 3 frame) titik tengahnya jatuh di antara frame 336 dan 337. Pengambilan pertama memberi frame 337 yang sudah menyorot "Dodi". Frame 336 aku ambil ulang secara tepat dan "Pak" berwarna kuning.

**Mix audio**

| Cek | Hasil | Status |
|---|---|---|
| Cue SFX yang terdengar di MP4 (12 dB di atas lantai sisa -66,4 dBFS) | 74 dari 74 | LOLOS |
| Efek paling keras (RMS 250 ms) | -18,1 dBFS | |
| Efek saat ada narasi | paling keras sekitar 3 sampai 6 dB di bawah VO di jendela yang sama, sebagian besar lebih rendah lagi | LOLOS |
| Cue yang diturunkan oleh mixSfx | 52 dari 74 (gain terkecil 0,07) | |
| Puncak mix | -4,5 dB (tidak clipping) | LOLOS |
| VO speech RMS (acuan) | -19,3 dBFS | |

Efek yang dipakai (jumlah cue): pop 14, whoosh 12, wave 7, boing 7, blip 5, flap 4, sparkle 3, thud 3, fadeOut 2, buzz 2, zip 2, lalu masing-masing 1 untuk clang, ding, barsDown, callDrop, ripple, servo, barsUp, rumble, click, ghost, poof, correct, bigPop.

**checkFlicker** (10 frame berurutan per scene, resolusi penuh)

| Mode | Isi | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| static | kamera dan isi dibekukan, blok yang berubah | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | LOLOS |
| moving | isi dibekukan, kamera bergerak, blok berosilasi | 47 | 98 | 5 | 0 | 128 | 220 | 108 | 8 | 7 | ditinjau |

Blok "moving" aku periksa dengan crop 200 % pada 6 frame berurutan dan peta selisih orde dua (|f[t-1] - 2 f[t] + f[t+1]|) untuk setiap scene. Yang menyala hanya garis tepi objek yang ikut bergerak saat kamera handheld berbalik arah. S6 paling banyak karena jendela ujinya jatuh tepat di guncangan kamera yang disengaja saat kabin berhenti (frame 1560). Tidak ada bercak di permukaan yang menandakan z-fighting dan tidak ada bintik merayap yang menandakan shimmer. Satu garis tipis 1 px di tepi pintu lantai lobi S2 terlihat putus-putus saat bergerak, ukurannya sangat kecil dan aku biarkan.

## 4. File yang dibuat atau diubah

- Baru: `data/short-04.*.json` (script, audio, whisper, words, timeline, sfxmix), `src/compositions/ShortVideo.tsx`, `src/compositions/Short04.tsx`, `src/scenes/short04/` (S1 sampai S9, layout, rings, tl, index), `src/world/short04/` (Building, Lift, Signal), `src/lib/captionPlacement.ts`, `src/sfx/types.ts`, `public/sfx/` (24 WAV), `scripts/makeSfx.ts`, `scripts/mixSfx.ts`, `scripts/checkTextOverlap.ts`, `scripts/fitFraming.ts`, `scripts/debugOverlap.ts`, `scripts/debugShift.ts`, laporan ini
- Diubah: `data/videos.ts` (entri short-04), `src/timeline.ts` (timeline per video), `src/components/TextLayers.tsx` (gaya clean, pita caption per halaman), `src/theme.ts`, `src/world/CameraRig.tsx` (lens shift dan `framed`), `src/scenes/SceneWorld.tsx`, `src/scenes/types.ts`, `src/world/Kampung.tsx` (varian short04), `src/world/characters/rig.ts` (pose telepon), `src/world/materials.ts`, `scripts/verifySync.ts`, `scripts/renderAll.ts`, `scripts/checkFlicker.ts`, `scripts/stills.ts`, `scripts/bench.ts`, `scripts/checkFinance.ts`, `scripts/paths.ts`, `package.json`, `README.md`
- ROOT: salinan `skrip-short-04-sinyal-lift.md`, VO di `AUDIO/30 Oktober 2026/Sinyal Lift.mp3` (nama sesuai tips rekaman di skrip, isi identik dengan unggahan)

## 5. Perintah

```
cd REMOTION-3D
npm run data:04
npm run make:sfx
npm run mix:sfx:04
npm run verify:04
npm run check:flicker:04
npm run still:check:04
npm run render:mix:04
npm run render:one:04
```

## 6. Waktu render

- Final 1080x1920: 54,3 menit untuk 2.510 frame (sekitar 1,3 detik per frame) dengan concurrency 2 di container 4 core tanpa GPU (SwiftShader). Sedikit lebih lambat per frame dari Short 02 karena gedung, kabin baja yang memantul, dan cincin transparan.
- Mix audio saja (`render:mix:04`): sekitar 30 detik.
- checkFlicker static dan moving: masing-masing sekitar 6 menit.
- File akhir 86,7 MB, H.264 CRF 17 (sekitar 8,1 Mbps) dan AAC 192 kbps.

## 7. Asumsi yang aku ambil

- Pemicu [sinyal HP] ditaruh di 0,4 detik, di kata "sinyal HP" pada kalimat pembuka, walaupun di skrip baris aksinya ditulis setelah [kotak yang kuat]. Menara mulai memancarkan cincin dari awal, lift jatuh di "kotak yang kuat".
- "Aksi utama" aku artikan sebagai wajah dan badan Pak Dodi dari lutut ke atas (termasuk tangan dan HP), HUD sinyal, dan objek yang sedang beraksi. Kaki di bawah lutut boleh berada di belakang caption. Tuti dihitung saat dia jadi pusat aksi (hantu di S8).
- Label atas (chip) juga aku jaga supaya tidak menutupi aksi, walaupun aturan hanya menyebut subtitle. Ini belum nol: cincin yang terbang dari langit sempat lewat di belakang label beberapa frame, dan papan SANGKAR FARADAY di S4 berada tepat di bawah label.
- Sound effect sintetis bergaya kartun, bukan rekaman foley asli, karena mengunduh aset harus izin dulu. Kalau mau efek rekaman, bisa diganti per file di `public/sfx/` tanpa mengubah kode.
- Pita caption 80 % adalah batas bawah supaya caption tidak masuk ke 20 % bawah yang tertutup UI Shorts.

## 8. Yang belum bisa diuji

- Render di Windows dengan GPU dan Remotion Studio interaktif (container ini headless).
- Mendengarkan mix secara langsung. Keseimbangan SFX dan VO dicek dengan pengukuran level, bukan telinga.
- Penerapan aturan baru ke Short 02 (belum diminta, Short 02 tetap seperti hasil sebelumnya).
