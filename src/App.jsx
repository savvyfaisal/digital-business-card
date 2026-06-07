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
  return lines.join('\\n');
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
        <button className="ghost-btn" onClick={onBack}>
          ← Back to Builder
        </button>
      </div>

      <div className="public-grid">
        <section className={`hero-card ${themeClass}`}>
          <span className="pill">Digital Business Card</span>
          <h1>{data.fullName || 'Your Name'}</h1>
          <h2>{data.jobTitle || 'Your Job Title'}</h2>
          <p className="company">{data.company || 'Your Company'}</p>
          <p className="bio">
            {data.bio || 'Your professional summary will appear here.'}
          </p>

          <div className="contact-list">
            {data.email ? <a href={`mailto:${data.email}`}>{data.email}</a> : null}
            {data.phone ? <a href={`tel:${sanitizePhone(data.phone)}`}>{data.phone}</a> : null}
            {data.website ? (
              <a href={data.website} target="_blank" rel="noreferrer">
                {data.website}
              </a>
            ) : null}
          </div>
        </section>

        <section className="panel qr-card">
          <h3>Scan to Open</h3>
          <p>Scan this QR code to open the business card.</p>
          <img src={qrUrl} alt="QR Code" className="qr-image" />
          <a className="primary-btn" href={shareUrl} target="_blank" rel="noreferrer">
