# Prompt Claude Code: Short 02, Noel Menjawab, 3D Stylized Bangun dari Nol

Cara pakai:
1. Pastikan file ini, `skrip-short-02-bunga-flat.md`, dan VO `AUDIO\30 Oktober 2026\Bunga Flat.mp3` ada (sudah ada).
2. Buka PowerShell, jalankan `cd "E:\29 Oktober 2026_ Youtube Short Content"` lalu `claude`.
3. Tempel seluruh isi blok di bawah ini.

```text
Kamu engineer dan animator 3D yang memakai project Remotion + Three.js yang sudah ada untuk membuat Short baru "Kenapa bunga flat kelihatan murah, padahal mahal" untuk channel "Noel Menjawab". Kerjakan di komputer ini (Windows, PowerShell). Baca seluruh prompt dulu sebelum mulai.

KONTEKS
- Ini Short ke-2. Project REMOTION-3D sudah ada (dibangun untuk Short 01 tentang tutup got). Pakai ulang pipeline (audio, transkripsi, parse, align, caption, tema) dan komponen dunia serta karakter yang sudah ada. Yang baru adalah data skrip, scene, dan properti topik ini. Jangan merusak atau menimpa Short 01.
- Naskah memakai rumus "bangun dari nol" (kamu bikin aturan bunga paling gampang, tiap perbaikan melahirkan masalah baru), 199 kata. VO sudah direkam: durasi sekitar 88,7 detik. Transkripsi menunjukkan isinya sama dengan naskah.
- Gaya: 3D STYLIZED dengan kualitas setara akun referensi howcomeid. Low poly tapi TIDAK TERLALU low: detail kecil dibuang, tetapi bentuk halus, material berkarakter, dan cahaya lembut. Grafik tidak boleh terlihat jelek, murahan, atau seperti prototipe. Dunia maket kampung yang hidup dengan satu tukang (Pak Dodi) dan satu burung (Tuti) sebagai pemanis lucu. Identitas, karakter, dan kalimat khasnya dibuat sendiri.
- Topik keuangan: angka di layar boleh dan perlu tampil, tapi harus sama persis dengan VO dan dihitung dari konstanta (lihat bagian DATA ANGKA). Tidak ada logo bank, merek, atau uang asli.
- Hasil lama jangan ditimpa. Hasil baru memakai nama di langkah kerja.

LINGKUNGAN
- ROOT: E:\29 Oktober 2026_ Youtube Short Content
- Path mengandung spasi dan garis bawah, selalu beri tanda kutip di PowerShell.
- Jangan menulis atau mengubah apa pun di luar ROOT.
- Pemilik channel adalah editor video profesional (Premiere, After Effects, DaVinci). Tema, durasi, dan keyframe harus terpusat dan mudah dikoreksi.

PETA FOLDER
ROOT\
  ASSETS\REFERENCES\Reference (1).mp4 sampai Reference (9).mp4    video referensi (720x1280). Hanya dibaca.
  AUDIO\30 Oktober 2026\Bunga Flat.mp3    voiceover Short 02. Sumber audio utama. JANGAN diubah. Durasi sekitar 88,7 detik.
  AUDIO\29 Oktober 2026\    audio Short 01. Jangan dipakai dan jangan diubah.
  FINAL OUTPUT\    hasil lama ada di sini. Jangan timpa.
  skrip-short-02-bunga-flat.md    skrip Short 02. Teks VO di dalamnya adalah sumber kebenaran.
  skrip-short-01-manhole.md    skrip Short 01. Abaikan.
  REMOTION\    project 2D lama. Abaikan.
  REMOTION-3D\    project yang dipakai. Punya scripts (prepareAudio, transcribe, parseScript, alignScenes, refineCaptions, verifySync, checkFlicker, renderAll), data, public\audio, src (world, scenes, components), whisper.cpp (ggml-small.bin dan ggml-medium.bin), node_modules.
Kalau file VO tidak ada di path di atas, berhenti dan beri tahu aku. Jangan memakai audio Short 01.
Data Short 01 (short-01.*) jangan dihapus. Buat data baru dengan awalan short-02.* supaya dua video bisa hidup berdampingan. Kalau pipeline terikat ke satu video, jadikan parameter (misalnya argumen CLI atau tabel konfigurasi di data\videos.ts).
Catatan durasi: VO 88,7 detik sudah di bawah batas 89,5 detik, jadi JANGAN mengubah jeda atau tempo. Kalau hasil ukur ternyata di atas 89,5 detik, berhenti dan tanya.

PELAJARAN DARI SHORT 01 (verifikasi di kode sebelum dipercaya)
- Caption pernah disembunyikan saat label tampil dan sempat bertahan 600 ms setelah kata terakhir. Pastikan itu sudah diperbaiki dan tidak kembali.
- Flicker pernah terjadi karena tekstur noise, bayangan bergeser, garis tipis, dan z-fighting. Pastikan perbaikan anti flicker tetap berlaku di scene baru.
- Timestamp whisper cenderung sedikit lebih awal di awal kata dan lebih lambat di akhir kata. Tetap koreksi dengan silencedetect.
- VO ini punya banyak jeda 0,3 sampai 0,6 detik di antara kalimat. Pakai jeda itu untuk perpindahan shot dan reaksi karakter, dan jangan menutupinya dengan layar diam.

GAYA VISUAL: 3D STYLIZED, LOW POLY TAPI TIDAK TERLALU LOW (WAJIB)
Target kualitas: setara howcomeid. Render 3D bersih semi-realistis yang disederhanakan. Bentuknya sederhana tapi halus, material punya karakter, cahaya lembut dan kaya, kedalaman jelas. "Low poly" di sini berarti detail kecil dibuang, BUKAN tampilan kasar. Tidak boleh terlihat seperti prototipe, blok polos, atau gim murahan. Kalau ragu, naikkan kualitas material dan cahaya dulu sebelum menambah poligon.
- Geometri: benda bulat memakai segmen cukup (koin, toples, dan silinder 48 segmen atau lebih, bola 24x16 atau lebih). Benda kotak memakai bevel (RoundedBox atau extrude berbevel) supaya tepinya menangkap cahaya. Objek organik (kepala karakter, awan, semak, kanopi pohon) memakai smooth shading. Flat shading hanya untuk faset yang disengaja, misalnya bebatuan.
- Material: MeshStandardMaterial atau MeshPhysicalMaterial dengan roughness dan metalness yang disetel (balok emas berkilap, balok bunga merah matte, kaca toples bening, kayu meja kasir, aspal kasar, genteng tanah liat, kain rompi). Permukaan tidak boleh datar polos: tambahkan variasi halus lewat vertex color atau tekstur prosedural BERFREKUENSI RENDAH (bercak besar, gradasi, retakan lebar).
- Tekstur yang aman dari flicker: dibuat sekali di awal lalu di-cache (tidak pernah dibuat ulang per frame), ukuran 1024 atau 2048, mipmap dan anisotropy aktif, minFilter LinearMipmapLinear, fitur besar (tidak ada bintik 1 sampai 2 piksel). Detail halus seperti kerikil, batu kecil, dan helai rumput dibuat sebagai geometri kecil ber-instance, bukan tekstur noise.
- Cahaya dan bayangan: directional light hangat dengan bayangan lunak yang stabil (frustum rapat dan tetap, cahaya tidak berpindah, bias disetel), hemisphere light, environment map prosedural sederhana (gradasi langit) agar logam punya pantulan, bayangan kontak di bawah objek, rim light tipis. Ambient occlusion lewat vertex color yang dibake atau SSAO/N8AO bila kompatibel dengan render Remotion dan lolos tes flicker.
- Pasca-proses ringan: color grading hangat, vignette halus, bloom sangat tipis pada kilau. Tidak ada efek yang berkedip. Cek dulu di dokumentasi apa yang kompatibel dengan render Remotion.
- Palet hangat dan kaya, bukan datar. Contoh awal (boleh disetel): langit biru #6EC6FF ke #CFEFFF, rumput #7CCB5B dengan variasi, aspal #4B4F5A, tanah #8A5A3C dan #A9744F berlapis, beton #C9C3B8, emas pokok #F2B632, merah bunga #D94B3F, kuning aksen #FFD23F, oranye rompi #FF8A3D.
- Dunia kampung Indonesia yang rapat dan berlapis, bukan bidang kosong. Wajib ada: langit gradasi dengan awan lembut bertepi halus yang bergeser pelan, gunung samar berkabut, rumah atap genteng dengan jendela dan pintu, warung kecil (tanpa merek asli), pohon kelapa dan pisang berkanopi berlapis, tiang listrik dengan kabel melengkung, lampu jalan, pagar, trotoar, kursi plastik, motor mainan, jalan dengan marka dan retakan lebar, rumput dengan variasi warna. Gunakan InstancedMesh agar ringan. Tiap scene luar ruangan minimal 3 lapisan kedalaman dan kabut ringan.
- Penampang (cutaway) maket: balok tanah dipotong dengan lapisan rumput dan tanah terlihat dari samping sebagai panggung kecil tempat papan FLAT dan EFEKTIF berdiri (dipakai di S6). Properti keuangan (balok pokok dan bunga, toples utang) dibuat sebagai objek 3D nyata yang tingginya mengikuti data, bukan grafik 2D.
- Variasi cahaya per scene: S1 sampai S3 pagi cerah, S5 sedikit redup saat papan 12 persen retak, S7 sampai S9 sore keemasan.
- Kamera: tiap scene minimal dua gerakan (dolly, orbit, push-in, tracking) dengan easing. Goyangan tangan halus yang deterministik (jumlah sinus dengan fase tetap, jangan Math.random). Punch-in singkat (scale 1 ke 1,08 dalam 3 frame) pada momen lucu dan getaran kamera pada benturan.
- Tidak ada footage, model, tekstur, atau karakter berhak cipta. Semua dibuat prosedural dari geometri. Tanya aku dulu kalau mau mengunduh aset apa pun.
- Uji kualitas: bandingkan still hasilmu dengan frame referensi (6) dan thumbnail howcomeid, lalu jawab jujur di laporan: apakah ini terlihat seperti gim murahan atau prototipe? Kalau ya, perbaiki material, cahaya, dan kedalaman sebelum lanjut.

KARAKTER DAN CERITA (sumber kebenaran: bagian Pemeran dan Aksi di skrip)
Bangun komponen yang bisa dipakai ulang di src\world\characters\:
- Pak Dodi: tukang yang meminjam uang. Tubuh gemuk dari kapsul dan silinder bersmooth shading, kepala bulat halus, helm kuning, rompi oranye, pipi merona, mata titik dengan kedip. Lengan dan kaki berupa grup yang diputar pada sendi (tanpa skeleton). Ia mewakili "kamu" di naskah.
- Tuti: merpati abu dari ellipsoid bersmooth shading dan bulu berlapis sederhana, paruh kerucut kuning, sayap pipih yang bisa mengepak, kacamata hitam untuk S9 kalau cocok. Tidak bicara.
- Benda mati tidak punya wajah: meja kasir kayu bertanda PINJAMAN, kalkulator raksasa, papan FLAT dan EFEKTIF, balok emas dan merah (pokok dan bunga), toples kaca (sisa utang), kalender flip, amplop, kantong ADMIN dan ASURANSI, timbangan kayu, mesin molen oranye. Semua berbevel, bermaterial halus, dan tanpa logo atau merek asli.
- Sistem ekspresi: netral, senang, kaget, berkeringat, bangga, bingung (garuk kepala). Ganti ukuran mata, bentuk mulut, dan alis, tanpa tekstur wajah.
- Idle yang selalu hidup: napas, kedip berkala dengan jeda acak deterministik, kepala melirik. Tidak ada karakter yang benar-benar diam.
Cerita: ikuti baris Aksi di skrip. Tiap baris diawali kata pemicu dalam kurung siku. Aksi itu harus mulai tepat saat kata tersebut diucapkan menurut data kata dari transkripsi (cari kata atau frasa itu di scene yang bersangkutan, toleran terhadap koma dan huruf besar). Kalau pemicu tidak ditemukan, laporkan dan pakai posisi proporsional di scene.
Gurauan boleh kamu tambah selama tidak mengubah VO dan tidak menambah klaim fakta baru. Tidak ada orang yang celaka.

PRINSIP ANIMASI (setiap scene harus lolos)
- Antisipasi: sebelum aksi besar, gerak berlawanan kecil 4 sampai 6 frame.
- Squash dan stretch pada pendaratan (skala Y 0,8 dan X 1,15 selama 3 frame lalu kembali).
- Overshoot dan settle memakai spring dengan preset bernama (snappy, bouncy, heavy) yang dipusatkan di src\anim.ts.
- Follow-through dan secondary motion: helm bergoyang, bulu Tuti, gerak sisa.
- Reaksi: tiap kejadian dibalas reaksi karakter lain.
- Partikel deterministik (debu, percikan, bunga api) dengan random dari remotion dan seed tetap, bentuk low poly sederhana.
- Tidak ada layar diam lebih dari sekitar 0,8 detik. Panjang shot rata-rata sekitar 3 detik, tiap kata "tapi" atau "jadi" di naskah memicu perubahan visual.
- Semua animasi dihitung dari useCurrentFrame, interpolate, dan spring. DILARANG memakai useFrame bawaan react-three-fiber, physics engine real-time, atau Math.random di jalur render.
- Transisi antar scene: potong cepat, whip pan sekitar 6 sampai 8 frame, atau objek lewat di depan kamera (Tuti terbang melintas). Motion blur hanya di transisi kalau waktu render masih wajar. Tidak ada wipe kuning.

SUBTITLE, LABEL, DAN KARTU JUDUL (WAJIB SINKRON)
Tiga lapisan teks yang terpisah dan tidak boleh saling menutupi atau saling menyembunyikan:
1. Subtitle VO (bawah): putih tebal dengan outline gelap tebal, kata yang sedang diucapkan berwarna kuning. Posisi sekitar 62 sampai 72 persen dari atas layar, di dalam zona aman. Satu halaman 1 sampai 4 kata dan maksimal sekitar 24 karakter. Pecah halaman juga pada jeda suara lebih dari 0,2 detik dan pada tanda baca. TIDAK PERNAH disembunyikan. Teks sama persis dengan VO di skrip (ejaan skrip, bukan hasil transkripsi mentah).
   Pewaktuan: halaman muncul tepat saat kata pertamanya mulai (pre-roll maksimal 40 ms), kata aktif berpindah tepat di awal tiap kata, halaman hilang di akhir kata terakhir ditambah maksimal 150 ms atau saat halaman berikutnya mulai. Hapus HOLD 600 ms.
2. Label (atas): chip gelap berteks putih dengan kata kunci kuning, isinya dari Teks layar di skrip. Tiap label muncul tepat saat kata berbintangnya diucapkan dan hilang paling lambat saat scene berakhir atau setelah sekitar 2,5 detik. Posisi sekitar 14 sampai 22 persen dari atas layar. Jangan menduplikasi kalimat subtitle.
3. Kartu judul S1: dua baris di pita gelap bawah layar sejak frame pertama (baris pertama putih, baris kedua kuning dan lebih besar), mengikuti gaya cover akun referensi. Tampil sampai akhir scene S1 dan tidak menutupi karakter.
Tulisan "Noel Menjawab" tampil sebagai teks besar di akhir S9 (sekitar 1,5 detik terakhir). Ambil nilainya dari theme.channelName. Tidak ada logo gambar.
Zona aman: hindari 20 persen bawah dan 12 persen sisi kanan untuk teks penting. Simpan sebagai konstanta di theme.

Perbaikan data waktu (scripts\transcribe.ts atau skrip baru scripts\refineCaptions.ts):
- Pakai timestamp whisper sebagai dasar. Kalau waktu memungkinkan, coba model yang lebih besar (medium) dan bandingkan.
- Jalankan ffmpeg silencedetect pada audio yang dipakai render. Untuk kata yang berbatasan dengan jeda, snap awal kata ke akhir hening dan akhir kata ke awal hening berikutnya bila selisihnya di bawah 250 ms. Perbaiki juga kata terakhir kalau akhirnya meleset.
- Simpan hasilnya dan tulis ringkasan selisih sebelum dan sesudah.

PENGECEKAN SINKRON (scripts\verifySync.ts, WAJIB LOLOS)
1. Dari audio yang dipakai render, hitung titik awal suara (akhir hening) dan akhir suara (awal hening). Untuk setiap halaman caption, awal halaman harus berada dalam rentang 80 ms sebelum sampai 40 ms sesudah awal suara pada batas jeda. Akhir halaman maksimal 250 ms setelah suara berhenti. Laporkan tabel dan jumlah pelanggaran. Lebih dari 5 persen pelanggaran berarti gagal.
2. Setelah render, ekstrak audio dari MP4 hasil render dengan ffmpeg, transkripsi kata sekali lagi, lalu bandingkan waktu tiap kata dengan waktu caption. Median selisih harus di bawah 80 ms dan persentil 95 di bawah 200 ms. Pastikan start_time audio dan video di MP4 sama-sama 0 dan durasi sama dalam toleransi 50 ms (ffprobe).
3. Pemeriksaan visual: render still pada 10 titik acak yang jatuh di tengah kata, lihat gambarnya sendiri, dan pastikan kata di layar adalah kata yang sedang diucapkan dan berwarna kuning.
4. Cek pemicu Aksi: untuk tiap kata pemicu, laporkan waktu kata dan frame aksi dimulai. Selisih maksimal 100 ms.

ANTI FLICKER (WAJIB LOLOS)
- Tekstur hanya yang berfrekuensi rendah, dibuat sekali dan di-cache, dengan mipmap dan anisotropy aktif. Tidak ada noise bintik halus. Detail halus dibuat sebagai geometri ber-instance. Kalau suatu efek (SSAO, bayangan lunak, bloom) menimbulkan kedipan, matikan atau ganti dengan versi yang dibake.
- Hindari garis tipis di bawah 2 piksel pada dunia 3D (marka jalan dibuat lebar atau berupa geometri berketebalan nyata). Beri offset ketinggian 0,003 atau lebih pada permukaan sejajar, atau pakai polygonOffset, untuk mencegah z-fighting.
- Pakai satu ThreeCanvas persisten untuk seluruh video dan pindah antar scene dengan menyalakan grup scene. Kalau mustahil di Remotion, premount Canvas lebih awal dan pastikan tidak ada frame kosong saat transisi.
- Pastikan antialiasing benar-benar aktif saat render headless dengan ANGLE. Kalau jagged edge terlihat, render dengan skala 1,5 lalu perkecil ke 1080x1920.
- Semua nilai acak memakai random dari remotion dengan seed tetap.
- Tes otomatis scripts\checkFlicker.ts: render potongan pendek tiap scene, ambil frame berurutan pada segmen kamera yang lambat, hitung energi turunan kedua temporal (|f[t-1] - 2 f[t] + f[t+1]|) per blok, dan tandai blok yang melonjak jauh di atas median. Lihat juga 8 frame berurutan yang diperbesar 200 persen pada area tanah, marka, dan tepi bayangan. Perbaiki sampai tidak ada blok yang menonjol.

REFERENSI (9 video di ASSETS\REFERENCES, hanya untuk dipelajari)
Ekstrak contact sheet dengan ffmpeg bawaan Remotion (npx remotion ffmpeg) atau ffmpeg sistem, misalnya 12 frame per video dalam grid 6x2, lalu LIHAT gambarnya. Untuk referensi 1, 5, 6, 9, ekstrak juga beberapa frame berukuran penuh. Jangan menyalin karakter, adegan, atau branding mereka. Ambil prinsipnya.
- Reference (5), tentang bau tanah: karakter low poly ramah (kepala bulat, pipi merona, mata titik), cahaya hangat, makhluk kecil bermata, label chip gelap, subtitle pendek.
- Reference (6), tentang rel kereta: dunia berlapis (langit berawan, sawah, rumah, pohon, kabel), penampang lapisan tanah, tokoh bertopi untuk skala, subtitle sangat pendek. Paling dekat dengan genre howcomeid.
- Reference (9), gurauan berskala ekstrem: komedi low poly, reaksi berlebihan, kamera whip.
- Reference (1), gnome di bunker: cerita lewat tokoh kecil di penampang, kamera menembus lapisan tanah.
- Reference (2), (3), (7), (8) bergaya 2D vektor: bukan gaya yang dituju. Pelajari cara membungkus cerita dengan protagonis, ekspresi, dan potongan cepat tiap 2 sampai 3 detik.
- Reference (4), irisan kiwi fotorealistik: bukan gaya yang dituju. Ambil hanya ide motion blur pada gerakan cepat.
Tuliskan di laporan akhir ringkasan 5 poin gaya yang kamu tangkap dan bagaimana tiap poin diterapkan.

DATA ANGKA (src\finance.ts, semua angka di layar dihitung dari sini, tidak boleh ditulis tangan)
- Pinjaman P = 12.000.000, tenor n = 12 bulan, bunga flat 1 persen per bulan dari pokok awal.
- Pokok per bulan = P / n = 1.000.000. Bunga per bulan = P x 1 persen = 120.000. Cicilan = 1.120.000 (tetap). Total bunga = 1.440.000.
- Sisa utang setelah bulan ke-6 = P minus 6 x pokok = 6.000.000, yaitu separuh dari P. Bunga tetap 120.000 pada bulan itu.
- Bunga efektif: cari r per bulan yang membuat nilai kini semua cicilan sama dengan P (bisection atau Newton). Hasil yang diharapkan sekitar 1,79 persen per bulan, atau sekitar 21,46 persen per tahun (r x 12). Layar menampilkan "sekitar 21%". Rasio terhadap 12 persen sekitar 1,79, jadi "hampir 2x lipat".
- Tulis scripts\checkFinance.ts yang menghitung nilai di atas dan menegaskan toleransinya. Jalankan di verify. Kalau hasil hitung berbeda dari angka di skrip, berhenti dan laporkan, jangan ubah VO.
- Tinggi objek 3D mengikuti data: balok pokok 1,00 satuan, balok bunga 0,12 satuan (boleh dilebihkan secara visual tapi konsisten dan sama tiap bulan), toples mengisi sebesar sisa utang dibagi P, papan 12 persen dan papan 21 persen berskala 12 banding 21,46, dua papan 12 persen bertumpuk hampir menyamai papan 21 persen.
- Angka yang boleh tampil di layar: 12 juta, 1%, 12%, 1 juta, 120 ribu, sekitar 21%, hampir 2x lipat. Tidak ada angka lain.

PARSER (perbarui scripts\parseScript.ts dan src\types.ts)
- Skrip punya label Durasi, VO, Teks layar, Aksi (daftar bertingkat), Visual. Baca Aksi sebagai daftar objek berisi trigger (teks dalam kurung siku) dan description. Tabel Pemeran dan metadata channel boleh dibaca sebagai metadata opsional.
- Teks layar: pisahkan dengan garis miring, kata di antara bintang jadi highlight kuning.
- Validasi dengan pesan error jelas untuk label yang hilang atau trigger yang tidak ditemukan di VO.
- Tipe scene lewat tabel sceneTypeMap: S1 hook (meja kasir PINJAMAN dan papan FLAT), S2 loan (Pak Dodi pinjam dan mesin molen), S3 installment (balok pokok dan bunga, kalender flip), S4 balance (toples menyusut, bunga tetap), S5 overpay (koin kembali, papan 12 persen retak jadi 21 persen), S6 effective (papan EFEKTIF dan perbandingan 12 lawan 21), S7 nuance (amplop dan timbangan), S8 tips (balon tanya, kantong ADMIN dan ASURANSI), S9 cta (kartu jawaban, balon komentar, end card). Komponen scene boleh dibuat per scene karena kini spesifik, tapi simpan komponen dunia dan karakter yang dipakai ulang agar template bisa dipakai untuk video lain.

IZIN DAN BATAS
- Boleh tanpa bertanya: paket npm, model whisper, dan perintah ffmpeg lokal.
- Jangan menulis ke luar ROOT, jangan menimpa hasil lama, jangan mengubah file di AUDIO dan ASSETS.
- Tanya dulu kalau perlu mengunduh aset eksternal, menginstal program, atau mengubah teks VO.
- Kalau render 3D terlalu lambat, kurangi efek berat (SSAO, jumlah instance, resolusi bayangan) dan naikkan concurrency dengan hati-hati sebelum menurunkan kualitas material. Jangan turun ke gaya flat atau 2D, dan jangan membuat grafik terlihat kasar demi kecepatan. Lapor perkiraan waktu render.
- Putuskan sendiri hal kecil dan catat di laporan. Berhenti dan tanya hanya jika benar-benar terhalang.

LANGKAH KERJA
1. Baca skrip, README, src, scripts, dan data yang ada. Cek skill Remotion yang tersedia dan dokumentasi untuk Three.js, audio, dan motion blur. Jangan mengandalkan ingatan untuk nama API.
2. Pastikan file VO baru ada. Ukur durasi dan jeda dengan ffprobe dan silencedetect. Kalau lebih dari 90 detik, rapatkan jeda (jeda di atas 0,3 detik menjadi sekitar 0,2 detik) tanpa mengubah tempo, hasil maksimal 89,5 detik. Kalau masih lebih, berhenti dan tanya aku. Kalau sudah 89,5 detik atau kurang, jangan ubah jeda.
3. Tonton referensi (contact sheet dan frame penuh). Tulis 5 poin gaya.
4. Jangan hapus data Short 01. Buat data short-02.* lalu jalankan parse, transkripsi, refineCaptions, dan align untuk skrip baru. Pastikan verifySync dan checkFlicker bisa dijalankan untuk video mana pun, dan tambahkan checkFinance.
5. Pakai ulang dunia, karakter, dan material yang ada, lalu naikkan kualitasnya bila belum setara howcomeid. Bangun properti topik ini (meja kasir, papan, balok, toples, kalender, amplop, kantong, timbangan). Buat satu composition uji untuk melihat semuanya dari beberapa sudut dan lihat still-nya sebelum lanjut.
6. Bangun scene S1 sampai S9 mengikuti Aksi di skrip dengan pemicu dari waktu kata. Kerjakan satu per satu dan lihat still di awal, tengah, dan akhir tiap scene sebelum lanjut.
7. Bangun subtitle, label, kartu judul, dan end card sesuai aturan di atas.
8. Render pratinjau kualitas rendah untuk Studio. Jalankan still:check dan checkFlicker, perbaiki sampai lolos.
9. Render akhir ke "E:\29 Oktober 2026_ Youtube Short Content\FINAL OUTPUT\30 Oktober 2026\Kenapa bunga flat kelihatan murah (3D v1).mp4" (1080x1920, 30 fps, H.264, 90 detik atau kurang). Jalankan verifySync pada hasil render.
Script npm yang harus ada atau diperbarui: dev, data, verify:sync, check:flicker, still:check, render:preview, render:one (ke nama v3), render:all.

AKSEPTASI (laporkan hasil tiap poin, jangan melapor selesai sebelum lolos)
1. Teks VO di data sama persis dengan VO di skrip. File di AUDIO tidak berubah (cek ukuran dan tanggal).
2. verifySync lolos: pelanggaran awal halaman maksimal 5 persen, median selisih setelah render di bawah 80 ms dan persentil 95 di bawah 200 ms, audio dan video sama-sama mulai di 0.
3. Subtitle VO tidak pernah hilang selama ada suara, dan label tidak menutupi subtitle atau karakter.
4. Tidak ada flicker yang menonjol menurut checkFlicker dan pemeriksaan visual 8 frame berurutan.
5. Semua scene punya karakter yang bereaksi, minimal 3 lapisan kedalaman, minimal 2 gerakan kamera, dan tidak ada momen diam lebih dari sekitar 0,8 detik.
6. Gaya 3D stylized (low poly tapi tidak terlalu low) yang setara kualitas howcomeid: bentuk halus, material berkarakter, cahaya lembut, bukan flat 2D, bukan terlihat seperti prototipe, dengan dunia berlapis di semua scene luar ruangan.
7. Semua angka di layar sama dengan VO dan dihitung dari finance.ts (checkFinance lolos), tinggi balok, toples, dan papan mengikuti data, tidak ada logo atau merek asli.
8. Kartu judul S1 dan end card "Noel Menjawab" di S9 tampil sesuai aturan.
9. MP4 akhir berdurasi 90 detik atau kurang, bisa diputar dengan suara, dan hasil lama tidak berubah.

ATURAN TEKS
- Teks di video berasal dari skrip.
- Teks yang tampil di video dan di laporan tidak boleh memakai tanda pisah panjang (em dash) atau titik koma.
- Komentar kode singkat, dalam bahasa Inggris.

LAPORAN AKHIR
Singkat dan jelas: 5 poin gaya dari referensi, ringkasan perubahan per masalah (flat, flicker, animasi, subtitle), tabel hasil verifySync dan checkFlicker, daftar file yang dibuat atau diubah, perintah menjalankan Studio dan render, waktu render, asumsi yang kamu ambil, dan hal yang belum bisa diuji.
```

## Catatan untukmu

- VO sudah ada (88,7 detik, isinya sama dengan naskah menurut transkripsi). Karena di bawah 89,5 detik, jeda tidak diubah. Jeda VO cukup banyak (sekitar 0,3 sampai 0,6 detik). Kalau nanti pacing terasa lambat, versi VO yang jedanya dirapatkan ke sekitar 0,2 detik bisa memangkas sekitar 4 sampai 6 detik, tapi itu keputusanmu dan file asli tidak disentuh.
- Gayanya 3D stylized setara howcomeid. Render lebih berat daripada versi flat, jadi pakai kualitas rendah untuk pratinjau.
- Topik ini informasi umum, bukan saran keuangan. Jangan menambah klaim hukum atau klaim bunga flat melanggar aturan.
- Kalimat penutup dan end card memakai nama "Noel Menjawab".
