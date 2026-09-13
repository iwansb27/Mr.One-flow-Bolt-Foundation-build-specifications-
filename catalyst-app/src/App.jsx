import { useEffect, useMemo, useState } from 'react';

const TYPES = ['INSPIRATION', 'MOTIVATION', 'VIRAL NEWS INDONESIA', 'CUSTOM'];

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request gagal.');
  return data;
}

export default function App() {
  const [mode, setMode] = useState('CUSTOM_CONTENT');
  const [contentType, setContentType] = useState('INSPIRATION');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [video, setVideo] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState(null);

  const current = useMemo(() => jobs.find((job) => job.id === selected) || null, [jobs, selected]);

  async function refresh() {
    const [items, status] = await Promise.all([
      request('/api/jobs'),
      request('/api/config/status')
    ]);
    setJobs(items);
    setProvider(status);
    if (selected) setSelected(items.find((item) => item.id === selected)?.id || null);
  }

  useEffect(() => { refresh().catch((error) => setNotice(error.message)); }, []);

  async function createJob(event) {
    event.preventDefault();
    if (!video) return setNotice('Pilih video MP4 terlebih dahulu.');
    if (mode === 'AFFILIATE' && !affiliateLink.trim()) return setNotice('Affiliate link wajib diisi.');
    setBusy(true);
    setNotice('Memproses video...');
    try {
      const form = new FormData();
      form.append('video', video);
      form.append('mode', mode);
      form.append('contentType', contentType);
      form.append('affiliateLink', affiliateLink);
      const job = await request('/api/jobs', { method: 'POST', body: form });
      await refresh();
      setSelected(job.id);
      setNotice('Video masuk pipeline dan metadata awal sudah dibuat.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    if (!current) return;
    setBusy(true);
    try {
      await request(`/api/jobs/${current.id}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(current.metadata)
      });
      await request(`/api/jobs/${current.id}/save-draft`, { method: 'POST' });
      await refresh();
      setNotice('Draft tersimpan.');
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function schedule() {
    if (!current) return;
    const scheduledAt = window.prompt('Masukkan waktu ISO, contoh 2026-09-14T09:00:00+07:00');
    if (!scheduledAt) return;
    try {
      await request(`/api/jobs/${current.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt, timezone: 'Asia/Jakarta' })
      });
      await refresh();
      setNotice('Konten dijadwalkan.');
    } catch (error) { setNotice(error.message); }
  }

  async function publish() {
    if (!current) return;
    try {
      await request(`/api/jobs/${current.id}/publish`, { method: 'POST' });
      await refresh();
      setNotice('Distribusi diproses sesuai provider yang aktif.');
    } catch (error) { setNotice(error.message); }
  }

  async function remove() {
    if (!current || !window.confirm('Hapus job dan file sementara?')) return;
    try {
      await request(`/api/jobs/${current.id}`, { method: 'DELETE' });
      setSelected(null);
      await refresh();
      setNotice('Job dan file sementara dihapus.');
    } catch (error) { setNotice(error.message); }
  }

  function updateMetadata(key, value) {
    setJobs((items) => items.map((job) => job.id === selected
      ? { ...job, metadata: { ...job.metadata, [key]: value } }
      : job));
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MR.ONE</p>
          <h1>Custom Content & Affiliate</h1>
          <p className="muted">Publishing/orchestration engine — bukan video generator.</p>
        </div>
        <div className="badge">Zoho-first + BYOK</div>
      </header>

      {notice && <div className="notice">{notice}</div>}

      <section className="grid">
        <form className="panel" onSubmit={createJob}>
          <div className="panel-title"><span>1</span><div><h2>Input</h2><p>Video pendek yang sudah jadi.</p></div></div>
          <label>Mode</label>
          <div className="segmented">
            <button type="button" className={mode === 'CUSTOM_CONTENT' ? 'active' : ''} onClick={() => setMode('CUSTOM_CONTENT')}>CUSTOM CONTENT</button>
            <button type="button" className={mode === 'AFFILIATE' ? 'active' : ''} onClick={() => setMode('AFFILIATE')}>AFFILIATE</button>
          </div>
          {mode === 'CUSTOM_CONTENT' && <>
            <label>Content Type</label>
            <select value={contentType} onChange={(event) => setContentType(event.target.value)}>
              {TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </>}
          <label>Video MP4</label>
          <input type="file" accept="video/mp4,.mp4" onChange={(event) => setVideo(event.target.files?.[0] || null)} />
          {mode === 'AFFILIATE' && <>
            <label>Affiliate Link</label>
            <input value={affiliateLink} onChange={(event) => setAffiliateLink(event.target.value)} placeholder="1 affiliate link" />
            <small>Marketplace dikenali otomatis dari domain.</small>
          </>}
          <button className="primary" disabled={busy}>{busy ? 'Memproses...' : 'Masukkan ke Pipeline'}</button>
        </form>

        <section className="panel">
          <div className="panel-title"><span>2</span><div><h2>Metadata</h2><p>Review sebelum Save Draft.</p></div></div>
          {!current ? <div className="empty">Belum ada job dipilih.</div> : <>
            <div className="chips"><span>{current.mode}</span><span>{current.contentType}</span>{current.marketplace && <span>{current.marketplace}</span>}</div>
            <label>Judul</label>
            <input value={current.metadata.title} onChange={(event) => updateMetadata('title', event.target.value)} />
            <label>Kategori</label>
            <input value={current.metadata.category} onChange={(event) => updateMetadata('category', event.target.value)} />
            <label>Deskripsi</label>
            <textarea rows="5" value={current.metadata.description} onChange={(event) => updateMetadata('description', event.target.value)} />
            <div className="actions"><button className="primary" onClick={saveDraft} disabled={busy}>Save Draft</button><button onClick={schedule} disabled={current.status !== 'DRAFT'}>Schedule</button><button onClick={publish} disabled={!current.schedule}>Publish</button></div>
          </>}
        </section>
      </section>

      <section className="panel">
        <div className="panel-title"><span>3</span><div><h2>Pipeline</h2><p>Storage → Preview/Review → Schedule → Distribution → Status → Cleanup.</p></div></div>
        <div className="pipeline">
          {['VIDEO', 'VALIDASI', 'METADATA', 'DRAFT', 'TERJADWAL', 'DISTRIBUSI'].map((stage) => <div key={stage} className={current && (current.status === stage || (stage === 'METADATA' && current.status === 'METADATA_READY')) ? 'stage active' : 'stage'}>{stage}</div>)}
        </div>
        <div className="job-list">
          {jobs.map((job) => <button key={job.id} className={job.id === selected ? 'job selected' : 'job'} onClick={() => setSelected(job.id)}><strong>{job.metadata.title}</strong><span>{job.status} · {job.mode}</span></button>)}
          {!jobs.length && <div className="empty">Belum ada konten.</div>}
        </div>
        {current && <div className="footer-actions"><span>Provider: {current.distribution.provider}</span><button className="danger" onClick={remove}>Cleanup / Delete</button></div>}
      </section>

      <section className="panel provider-panel">
        <div><h2>Provider & BYOK</h2><p className="muted">Nilai rahasia tidak ditanam di source. Zoho-first aktif bila override tidak diberikan.</p></div>
        <div className="provider-grid">
          <div><b>AI</b><span>{provider?.defaults?.ai || 'zoho'}</span><em>{provider?.byok?.openRouter ? 'BYOK tersedia' : 'Default'}</em></div>
          <div><b>Database</b><span>{provider?.defaults?.database || 'zoho'}</span><em>Default</em></div>
          <div><b>Storage</b><span>{provider?.defaults?.storage || 'zoho'}</span><em>Default</em></div>
          <div><b>Publishing</b><span>{provider?.defaults?.publish || 'zoho'}</span><em>{provider?.byok?.buffer ? 'BYOK tersedia' : 'Default'}</em></div>
        </div>
      </section>
    </main>
  );
}
