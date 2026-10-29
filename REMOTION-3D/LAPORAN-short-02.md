# Laporan Short 02: Kenapa bunga flat kelihatan murah (3D v1)

Status: RENDER_STATUS

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

RESULTS_BLOCK
