import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import { detectMarketplace, localMetadataFallback, providerStatus } from './providers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const uploads = path.join(root, 'runtime-uploads');
const dataDir = path.join(root, 'runtime-data');
const recordsFile = path.join(dataDir, 'jobs.json');
await fs.mkdir(uploads, { recursive: true });
await fs.mkdir(dataDir, { recursive: true });

async function readJobs() {
  try {
    return JSON.parse(await fs.readFile(recordsFile, 'utf8'));
  } catch {
    return [];
  }
}

async function writeJobs(jobs) {
  await fs.writeFile(recordsFile, JSON.stringify(jobs, null, 2));
}

const app = express();
const upload = multer({
  dest: uploads,
  limits: { fileSize: 250 * 1024 * 1024 }
});
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'MR.ONE CUSTOM CONTENT & AFFILIATE', mode: config.mode });
});

app.get('/api/config/status', (_req, res) => {
  res.json(providerStatus());
});

app.post('/api/jobs', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Video MP4 wajib diunggah.' });
  if (!req.file.originalname.toLowerCase().endsWith('.mp4')) {
    await fs.rm(req.file.path, { force: true });
    return res.status(400).json({ error: 'Input harus berupa file MP4.' });
  }

  const mode = req.body.mode === 'AFFILIATE' ? 'AFFILIATE' : 'CUSTOM_CONTENT';
  const contentType = mode === 'AFFILIATE' ? 'CUSTOM' : (req.body.contentType || 'CUSTOM');
  const affiliateLink = (req.body.affiliateLink || '').trim();

  if (mode === 'AFFILIATE' && !affiliateLink) {
    await fs.rm(req.file.path, { force: true });
    return res.status(400).json({ error: 'Affiliate link wajib diisi untuk mode AFFILIATE.' });
  }

  const marketplace = affiliateLink ? detectMarketplace(affiliateLink) : null;
  const id = randomUUID();
  const metadata = localMetadataFallback({ contentType, marketplace });
  const job = {
    id,
    mode,
    contentType,
    marketplace,
    affiliateLink,
    originalFileName: req.file.originalname,
    filePath: req.file.path,
    status: 'METADATA_READY',
    metadata,
    schedule: null,
    distribution: { provider: config.publishProvider, status: 'PENDING' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const jobs = await readJobs();
  jobs.unshift(job);
  await writeJobs(jobs);
  res.status(201).json(job);
});

app.get('/api/jobs', async (_req, res) => {
  res.json(await readJobs());
});

app.get('/api/jobs/:id', async (req, res) => {
  const job = (await readJobs()).find((item) => item.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job tidak ditemukan.' });
  res.json(job);
});

app.put('/api/jobs/:id/metadata', async (req, res) => {
  const jobs = await readJobs();
  const job = jobs.find((item) => item.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job tidak ditemukan.' });
  const allowed = ['title', 'category', 'description'];
  for (const key of allowed) {
    if (typeof req.body[key] === 'string') job.metadata[key] = req.body[key].trim();
  }
  job.metadata.source = 'user-review';
  job.updatedAt = new Date().toISOString();
  await writeJobs(jobs);
  res.json(job);
});

app.post('/api/jobs/:id/save-draft', async (req, res) => {
  const jobs = await readJobs();
  const job = jobs.find((item) => item.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job tidak ditemukan.' });
  job.status = 'DRAFT';
  job.updatedAt = new Date().toISOString();
  await writeJobs(jobs);
  res.json(job);
});

app.post('/api/jobs/:id/schedule', async (req, res) => {
  const jobs = await readJobs();
  const job = jobs.find((item) => item.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job tidak ditemukan.' });
  if (job.status !== 'DRAFT') return res.status(409).json({ error: 'Job harus disimpan sebagai draft sebelum scheduling.' });
  if (!req.body.scheduledAt) return res.status(400).json({ error: 'scheduledAt wajib diisi.' });
  job.schedule = { scheduledAt: req.body.scheduledAt, timezone: req.body.timezone || 'Asia/Jakarta' };
  job.status = 'TERJADWAL';
  job.updatedAt = new Date().toISOString();
  await writeJobs(jobs);
  res.json(job);
});

app.post('/api/jobs/:id/publish', async (req, res) => {
  const jobs = await readJobs();
  const job = jobs.find((item) => item.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job tidak ditemukan.' });
  if (!job.schedule) return res.status(409).json({ error: 'Job belum dijadwalkan.' });
  job.distribution = {
    provider: config.publishProvider,
    status: config.buffer.token ? 'QUEUED_FOR_BUFFER' : 'WAITING_FOR_BYOK',
    message: config.buffer.token ? 'Buffer BYOK tersedia; adapter siap menerima publish.' : 'Zoho-first mode aktif. Provider publishing eksternal belum diberi kredensial BYOK.'
  };
  job.status = job.distribution.status;
  job.updatedAt = new Date().toISOString();
  await writeJobs(jobs);
  res.json(job);
});

app.delete('/api/jobs/:id', async (req, res) => {
  const jobs = await readJobs();
  const index = jobs.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Job tidak ditemukan.' });
  const [job] = jobs.splice(index, 1);
  if (job.filePath) await fs.rm(job.filePath, { force: true });
  await writeJobs(jobs);
  res.json({ deleted: true, id: job.id });
});

const dist = path.join(root, 'dist');
app.use(express.static(dist));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

const port = Number(process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 9000);
app.listen(port, () => console.log(`MR.ONE Catalyst app listening on ${port}`));
