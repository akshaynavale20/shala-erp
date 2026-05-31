/**
 * VerifyPage — Public document verification
 * Route: /verify/receipt/:receiptNumber
 * No auth required. Opened when someone scans the QR on a fee receipt.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, Result } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, SafetyCertificateOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

interface VerifyResult {
  valid: boolean;
  type: string;
  receiptNumber?: string;
  issueDate?: string;
  schoolName?: string;
  unitName?: string;
  logoUrl?: string;
  message?: string;
}

export default function VerifyPage() {
  const { receiptNumber } = useParams<{ receiptNumber: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData]   = useState<VerifyResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!receiptNumber) { setError(true); setLoading(false); return; }
    axios.get<VerifyResult>(`${API_BASE}/api/v1/verify/receipt/${encodeURIComponent(receiptNumber)}`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [receiptNumber]);

  // ── tokens
  const accent  = '#1f3a8a';
  const tint    = '#eef1f9';
  const success = '#15803d';
  const danger  = '#b91c1c';
  const muted   = '#6b7280';

  return (
    <div style={{
      minHeight: '100vh', background: '#f1f5f9',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 16px',
      fontFamily: "'Noto Sans Devanagari', 'Noto Sans', sans-serif",
    }}>
      {/* card */}
      <div style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 440,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)', overflow: 'hidden',
      }}>
        {/* header bar */}
        <div style={{
          background: accent, padding: '18px 24px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <SafetyCertificateOutlined style={{ fontSize: 28, color: '#fff' }} />
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>दस्तऐवज सत्यापन</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 0.5 }}>
              Document Verification
            </div>
          </div>
        </div>

        {/* body */}
        <div style={{ padding: '28px 24px' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16, color: muted }}>तपासत आहे…</div>
            </div>
          )}

          {!loading && error && (
            <Result status="error" title="सत्यापन अयशस्वी"
              subTitle="दस्तऐवज माहिती मिळवताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा." />
          )}

          {!loading && !error && data && (
            <>
              {/* status badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: data.valid ? '#dcfce7' : '#fee2e2',
                border: `1.5px solid ${data.valid ? '#86efac' : '#fca5a5'}`,
                borderRadius: 8, padding: '12px 16px', marginBottom: 24,
              }}>
                {data.valid
                  ? <CheckCircleFilled  style={{ fontSize: 28, color: success }} />
                  : <CloseCircleFilled  style={{ fontSize: 28, color: danger  }} />
                }
                <div>
                  <div style={{
                    fontWeight: 700, fontSize: 16,
                    color: data.valid ? success : danger,
                  }}>
                    {data.valid ? 'दस्तऐवज वैध आहे ✓' : 'दस्तऐवज अवैध आहे ✗'}
                  </div>
                  <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>
                    {data.valid ? 'Document is Valid' : (data.message || 'Document is Invalid')}
                  </div>
                </div>
              </div>

              {/* school branding */}
              {data.schoolName && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: tint, borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                }}>
                  {data.logoUrl ? (
                    <img src={data.logoUrl} alt="logo"
                      style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 4 }} />
                  ) : (
                    <div style={{
                      width: 44, height: 44, borderRadius: 22, background: accent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {data.schoolName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 14, lineHeight: 1.3 }}>
                      {data.schoolName}
                    </div>
                    {data.unitName && data.unitName !== data.schoolName && (
                      <div style={{ fontSize: 12, color: accent, marginTop: 2 }}>{data.unitName}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Only issue date — no PII exposed */}
              {data.valid && data.issueDate && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderTop: '1px solid #f1f5f9', paddingTop: 16, marginTop: 4,
                }}>
                  <span style={{ fontSize: 12, color: muted }}>जारी दिनांक</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                    {dayjs(data.issueDate).format('DD MMMM YYYY')}
                  </span>
                </div>
              )}

              {!data.valid && data.message && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 6, padding: '10px 14px',
                  fontSize: 13, color: danger,
                }}>
                  {data.message}
                </div>
              )}
            </>
          )}
        </div>

        {/* footer */}
        <div style={{
          background: '#f8fafc', borderTop: '1px solid #e2e8f0',
          padding: '10px 24px', textAlign: 'center',
          fontSize: 11, color: muted,
        }}>
          हे सत्यापन पृष्ठ स्वयंचलित आहे · Automated verification portal
        </div>
      </div>
    </div>
  );
}
