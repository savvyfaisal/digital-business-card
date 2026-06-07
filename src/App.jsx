import React, { useEffect, useMemo, useState } from 'react';

function encodeCardData(data) {
  try {
    const json = JSON.stringify(data);
    return btoa(encodeURIComponent(json));
  } catch {
    return '';
  }
}

function decodeCardData(encoded) {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch {
    return null;
  }
}

function sanitizePhone(phone) {
  return (phone || '').replace(/[^\d+]/g, '');
}

function buildVCard(data, shareUrl) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${data.fullName || ''}`,
    `ORG:${data.company || ''}`,
    `TITLE:${data.jobTitle || ''}`,
    `TEL;TYPE=CELL:${sanitizePhone(data.phone)}`,
    `EMAIL:${data.email || ''}`,
    `URL:${data.website || shareUrl || ''}`,
    `NOTE:${data.bio || ''}`,
    'END:VCARD',
  ];
  return lines.join('\n');
}

function getHashParams() {
  const hash = window.location.hash || '';
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash;
  return new URLSearchParams(cleaned);
}

function PublicCard({ data, shareUrl, themeClass, onBack }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="page dark-bg">
      <div className="public-header">
        <button className="ghost-btn" onClick={onBack}>← Back to Builder</button>
      </div>

      <div className="public-grid">
        <section className={`hero-card ${themeClass}`}>
          <span className="pill">Digital Business Card</span>
          <h1>{data.fullName || 'Your Name'}</h1>
          <h2>{data.jobTitle || 'Your Job Title'}</h2>
          <p className="company">{data.company || 'Your Company'}</p>
          <p className="bio">{data.bio || 'Your professional summary will appear here.'}</p>

          <div className="contact-list">
            {data.email ? <a href={`mailto:${data.email}`}>{data.email}</a> : null}
            {data.phone ? <a href={`tel:${sanitizePhone(data.phone)}`}>{data.phone}</a> : null}
            {data.website ? (
              <a href={data.website} target="_blank" rel="noreferrer">{data.website}</a>
            ) : null}
          </div>
        </section>

        <section className="panel qr-card">
          <h3>Scan to Open</h3>
          <p>Scan this QR code to open the business card.</p>
          <img src={qrUrl} alt="QR Code" className="qr-image" />
          <a className="primary-btn" href={shareUrl} target="_blank" rel="noreferrer">Open Public Card</a>
          <p className="link-text">{shareUrl}</p>
        </section>
      </div>
    </div>
  );
}

export default function App() {
  const [loadedFromLink, setLoadedFromLink] = useState(false);
  const [themeKey, setThemeKey] = useState('royal');
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState({
    fullName: 'Faisal Khan',
    jobTitle: 'IT Director',
    company: 'PLD Global Group',
    phone: '+966 5X XXX XXXX',
    email: 'faisal@example.com',
    website: 'https://example.com',
    bio: 'Digital transformation leader focused on AI, cybersecurity, sports tech, and modern customer experience.',
  });

  const themes = {
    royal: { label: 'Royal Blue', className: 'theme-royal' },
    emerald: { label: 'Emerald', className: 'theme-emerald' },
    sunset: { label: 'Sunset', className: 'theme-sunset' },
    midnight: { label: 'Midnight', className: 'theme-midnight' },
  };

  useEffect(() => {
    const readFromHash = () => {
      const params = getHashParams();
      const encoded = params.get('card');
      const theme = params.get('theme');

      if (theme && themes[theme]) {
        setThemeKey(theme);
      }

      if (encoded) {
        const parsed = decodeCardData(encoded);
        if (parsed) {
          setData(parsed);
          setLoadedFromLink(true);
          return;
        }
      }

      setLoadedFromLink(false);
    };

    readFromHash();
    window.addEventListener('hashchange', readFromHash);
    return () => window.removeEventListener('hashchange', readFromHash);
  }, []);

  const encodedPayload = useMemo(() => encodeCardData(data), [data]);

  const shareUrl = useMemo(() => {
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}#card=${encodeURIComponent(encodedPayload)}&theme=${themeKey}`;
  }, [encodedPayload, themeKey]);

  const qrUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(shareUrl)}`;
  }, [shareUrl]);

  const updateField = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this link:', shareUrl);
    }
  };

  const openPublicCard = () => {
    window.location.hash = `card=${encodeURIComponent(encodedPayload)}&theme=${themeKey}`;
  };

  const goBackToBuilder = () => {
    window.location.hash = '';
    setLoadedFromLink(false);
  };

  const downloadVCard = () => {
    const vCardData = buildVCard(data, shareUrl);
    const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(data.fullName || 'business-card').replace(/\s+/g, '-').toLowerCase()}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeTheme = themes[themeKey];

  if (loadedFromLink) {
    return (
      <PublicCard
        data={data}
        shareUrl={shareUrl}
        themeClass={activeTheme.className}
        onBack={goBackToBuilder}
      />
    );
  }

  return (
    <div className="page light-bg">
      <div className="app-grid">
        <section className="panel form-panel">
          <div className="head-copy">
            <span className="pill dark">Website Builder</span>
            <h1>Digital Business Card Generator</h1>
            <p>Create a modern digital business card, generate a shareable link, and get a QR code instantly.</p>
          </div>

          <div className="form-grid">
            <label>
              <span>Full Name</span>
              <input value={data.fullName} onChange={(e) => updateField('fullName', e.target.value)} />
            </label>
            <label>
              <span>Job Title</span>
              <input value={data.jobTitle} onChange={(e) => updateField('jobTitle', e.target.value)} />
            </label>
            <label>
              <span>Company</span>
              <input value={data.company} onChange={(e) => updateField('company', e.target.value)} />
            </label>
            <label>
              <span>Phone</span>
              <input value={data.phone} onChange={(e) => updateField('phone', e.target.value)} />
            </label>
            <label>
              <span>Email</span>
              <input value={data.email} onChange={(e) => updateField('email', e.target.value)} />
            </label>
            <label>
              <span>Website / LinkedIn</span>
              <input value={data.website} onChange={(e) => updateField('website', e.target.value)} />
            </label>
          </div>

          <label className="full-width">
            <span>Short Bio</span>
            <textarea rows="5" value={data.bio} onChange={(e) => updateField('bio', e.target.value)} />
          </label>

          <div className="theme-select">
            <span className="theme-title">Choose Theme</span>
            <div className="theme-grid">
              {Object.entries(themes).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  className={`theme-option ${themeKey === key ? 'selected' : ''}`}
                  onClick={() => setThemeKey(key)}
                >
                  <div className={`theme-swatch ${item.className}`} />
                  <strong>{item.label}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="button-row">
            <button className="primary-btn" onClick={copyLink}>{copied ? 'Copied' : 'Copy Share Link'}</button>
            <button className="secondary-btn" onClick={downloadVCard}>Download .VCF</button>
            <button className="secondary-btn" onClick={openPublicCard}>Open Public Card</button>
          </div>

          <div className="generated-link">
            <strong>Generated Link</strong>
            <p>{shareUrl}</p>
          </div>
        </section>

        <section className="side-column">
          <div className={`preview-card ${activeTheme.className}`}>
            <span className="pill">Live Preview</span>
            <h2>{data.fullName || 'Your Name'}</h2>
            <h3>{data.jobTitle || 'Your Job Title'}</h3>
            <p className="company">{data.company || 'Your Company'}</p>
            <p className="bio">{data.bio || 'Your short professional summary will appear here.'}</p>
            <div className="preview-list">
              {data.email ? <div>{data.email}</div> : null}
              {data.phone ? <div>{data.phone}</div> : null}
              {data.website ? <div>{data.website}</div> : null}
            </div>
          </div>

          <div className="panel qr-panel">
            <h3>QR Code</h3>
            <p>Anyone can scan this QR code to open your digital business card.</p>
            <img src={qrUrl} alt="Generated QR Code" className="qr-image" />
            <button className="primary-btn full-btn" onClick={openPublicCard}>Test Generated Link</button>
            <p className="small-note">Tip: add this QR code to your email signature, event badge, or presentation slide.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
