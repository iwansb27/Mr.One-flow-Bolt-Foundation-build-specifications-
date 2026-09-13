# HANDOVER PERUBAHAN — MR.ONE OTO & AFFILIATE → CUSTOM CONTENT

## 1. Status Proyek Lama
Proyek AppDeploy “MR.ONE OTO & AFFILIATE” tetap dipertahankan tanpa perubahan dan digunakan sebagai sumber referensi untuk workflow, struktur, dan perilaku sistem.

## 2. Target Proyek Baru
Versi baru akan dibangun ulang di **Hatchable**. Source dan workflow proyek lama menjadi acuan, bukan untuk dimigrasikan secara mentah.

## 3. Perubahan Utama
Modul OTO (kendaraan) dihapus dan diganti menjadi **CUSTOM CONTENT**. Modul **AFFILIATE** tetap dipertahankan.

## 4. Workflow Utama — Tetap
`Upload video → Validasi → Metadata → Storage/Database → Preview/Review → Schedule → Buffer → Social Media → Pencatatan status → Cleanup`

## 5. Custom Content — Jenis Konten
- **INSPIRATION** — metadata berdasarkan video inspirasi.
- **MOTIVATION** — metadata berdasarkan video motivasi.
- **VIRAL NEWS INDONESIA** — metadata berdasarkan video berita/isu viral Indonesia.
- **CUSTOM** — metadata mengikuti isi video dan kebutuhan pengguna.

## 6. Logika Metadata
Metadata tidak lagi mengikuti template kendaraan. Sistem membaca konteks video dan jenis CONTENT TYPE yang dipilih, lalu menghasilkan metadata yang relevan tanpa mengarang fakta yang tidak tersedia.

## 7. UI / Input
Pilihan OTO pada sistem lama menjadi **CONTENT TYPE**. Pilihan AFFILIATE tetap tersedia. Field tambahan hanya ditampilkan jika memang relevan dengan jenis konten.

## 8. Arsitektur Implementasi
Implementasi baru dibuat modular dan sesederhana mungkin dibanding sistem lama, tetapi mempertahankan alur operasional yang sudah terbukti: video jadi masuk → diproses sebagai konten → disimpan → dijadwalkan → dikirim ke Buffer.

## 9. Posisi Sistem
MR.ONE tetap merupakan **publishing/orchestration engine**, bukan video generator. Sistem menerima video pendek yang sudah jadi dan mengelola metadata, penyimpanan, penjadwalan, distribusi, serta pencatatan status.

## 10. Testing
Pengujian minimal mencakup AFFILIATE, seluruh tipe CUSTOM CONTENT, validasi video, penyimpanan, preview, scheduling, Buffer/publishing flow, dan cleanup.

## 11. Catatan Implementasi
Jangan mengubah proyek AppDeploy lama. Gunakan proyek tersebut sebagai referensi perilaku dan workflow saat membangun versi baru di Hatchable.

## Catatan Terakhir
Proyek AppDeploy MR.ONE OTO & AFFILIATE yang lama tidak diubah. Proyek baru akan dibangun ulang di Hatchable dengan menjadikan source dan workflow MR.ONE lama sebagai referensi, kemudian modul OTO diganti menjadi CUSTOM CONTENT sesuai rancangan handover ini.
