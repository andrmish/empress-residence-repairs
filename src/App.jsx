import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, Plus, Check, Clock, AlertCircle, LogOut, Home, Wrench, X,
  Calendar, Send, ChevronLeft, Building2, MessageSquare, Image as ImageIcon, Loader2
} from 'lucide-react';
import { listRequests, createRequest, updateRequest, deleteRequest } from './data';

const APARTMENTS = [101, 102, 201, 202, 301, 302, 401, 402];
const BUILDING_NAME = 'Empress Residence';
const BUILDING_LOCATION = 'Potamos Germasogeias · Limassol';

const STATUS = {
  new: { label: 'New', color: '#C97A1F', bg: '#FBEFD9', icon: AlertCircle },
  in_progress: { label: 'In progress', color: '#1E3A5F', bg: '#DCE5F0', icon: Clock },
  done: { label: 'Done', color: '#4A6B3A', bg: '#E0EBD5', icon: Check },
  rejected: { label: 'Rejected', color: '#9B2C2C', bg: '#F5DCDC', icon: X },
};

// ---------- Image compression ----------
// Returns a Blob (jpeg) compressed to fit within maxWidth.
function compressImage(file, maxWidth = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
          'image/jpeg',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ---------- Date helpers ----------
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}
function fmtDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function todayInputValue() {
  return new Date().toISOString().split('T')[0];
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [user, setUser] = useState(null); // {role:'resident'|'management', apartment}
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | new | detail
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000); // poll every 10s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    try {
      const data = await listRequests();
      setRequests(data);
      setError(null);
    } catch (e) {
      setError(e.message || 'Could not load requests');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setView('list');
    setSelected(null);
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} error={error} />;
  }

  if (view === 'new' && user.role === 'resident') {
    return (
      <NewRequestForm
        apartment={user.apartment}
        onCancel={() => setView('list')}
        onSubmit={async ({ title, description, photoBlob }) => {
          await createRequest({
            apartment: user.apartment,
            title,
            description,
            photoBlob,
          });
          await refresh();
          setView('list');
        }}
      />
    );
  }

  if (view === 'detail' && selected) {
    return (
      <RequestDetail
        request={selected}
        user={user}
        onBack={() => { setView('list'); setSelected(null); }}
        onUpdate={async (updates) => {
          const updated = await updateRequest(selected.id, updates);
          setSelected(updated);
          await refresh();
        }}
        onDelete={async () => {
          await deleteRequest(selected.id);
          await refresh();
          setView('list');
          setSelected(null);
        }}
      />
    );
  }

  return (
    <ListView
      user={user}
      requests={requests}
      loading={loading}
      error={error}
      onLogout={logout}
      onNew={() => setView('new')}
      onOpen={(r) => { setSelected(r); setView('detail'); }}
    />
  );
}

// ============================================================
// LOGIN SCREEN
// ============================================================
function LoginScreen({ onLogin, error }) {
  return (
    <Shell>
      {/* Hero: SVG illustration of sunset over the residence */}
      <div style={{
        position: 'relative',
        height: 360,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <svg
          viewBox="0 0 480 360"
          preserveAspectRatio="xMidYMid slice"
          style={{ width: '100%', height: '100%', display: 'block' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2B3B52" />
              <stop offset="22%" stopColor="#6E4858" />
              <stop offset="48%" stopColor="#C9774A" />
              <stop offset="72%" stopColor="#B8462E" />
              <stop offset="100%" stopColor="#3D1B0E" />
            </linearGradient>
            <radialGradient id="sunGlow" cx="0.72" cy="0.42" r="0.5">
              <stop offset="0%" stopColor="#FFE6BE" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#FFC487" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FFC487" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="darken" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F1A14" stopOpacity="0" />
              <stop offset="100%" stopColor="#1F1A14" stopOpacity="0.6" />
            </linearGradient>
            <radialGradient id="sea-shimmer" cx="0.72" cy="0.62" r="0.45">
              <stop offset="0%" stopColor="#FFC487" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFC487" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="480" height="360" fill="url(#sky)" />
          <rect width="480" height="360" fill="url(#sunGlow)" />
          <g fill="white">
            <circle cx="60" cy="28" r="0.9" opacity="0.85" />
            <circle cx="150" cy="18" r="0.6" opacity="0.6" />
            <circle cx="220" cy="42" r="0.7" opacity="0.7" />
            <circle cx="35" cy="70" r="0.5" opacity="0.5" />
            <circle cx="115" cy="55" r="0.5" opacity="0.55" />
            <circle cx="180" cy="78" r="0.4" opacity="0.45" />
            <circle cx="90" cy="100" r="0.4" opacity="0.4" />
          </g>
          <circle cx="346" cy="148" r="26" fill="#FFE6BE" opacity="0.6" />
          <circle cx="346" cy="148" r="22" fill="#FFD89A" />
          <path
            d="M 0 218 L 50 202 L 110 215 L 170 198 L 230 212 L 290 200 L 360 213 L 420 202 L 480 215 L 480 230 L 0 230 Z"
            fill="#4A2418"
            opacity="0.55"
          />
          <rect y="225" width="480" height="50" fill="url(#sea-shimmer)" />
          <line x1="0" y1="225" x2="480" y2="225" stroke="#3D1B0E" strokeWidth="0.5" opacity="0.5" />
          <g fill="#1F0F08">
            <rect x="120" y="248" width="92" height="112" />
            <rect x="212" y="222" width="118" height="138" />
            <rect x="330" y="262" width="58" height="98" />
            <g fill="#FFE6BE">
              <rect x="132" y="262" width="5" height="7" opacity="0.7" />
              <rect x="148" y="262" width="5" height="7" opacity="0.4" />
              <rect x="164" y="262" width="5" height="7" opacity="0.65" />
              <rect x="180" y="262" width="5" height="7" opacity="0.35" />
              <rect x="196" y="262" width="5" height="7" opacity="0.6" />
              <rect x="132" y="286" width="5" height="7" opacity="0.5" />
              <rect x="164" y="286" width="5" height="7" opacity="0.7" />
              <rect x="196" y="286" width="5" height="7" opacity="0.45" />
              <rect x="132" y="310" width="5" height="7" opacity="0.6" />
              <rect x="180" y="310" width="5" height="7" opacity="0.4" />
              <rect x="196" y="310" width="5" height="7" opacity="0.65" />
              <rect x="148" y="334" width="5" height="7" opacity="0.55" />
              <rect x="180" y="334" width="5" height="7" opacity="0.4" />
              <rect x="226" y="236" width="6" height="9" opacity="0.7" />
              <rect x="244" y="236" width="6" height="9" opacity="0.5" />
              <rect x="262" y="236" width="6" height="9" opacity="0.75" />
              <rect x="280" y="236" width="6" height="9" opacity="0.4" />
              <rect x="298" y="236" width="6" height="9" opacity="0.6" />
              <rect x="316" y="236" width="6" height="9" opacity="0.45" />
              <rect x="226" y="262" width="6" height="9" opacity="0.55" />
              <rect x="262" y="262" width="6" height="9" opacity="0.7" />
              <rect x="298" y="262" width="6" height="9" opacity="0.5" />
              <rect x="316" y="262" width="6" height="9" opacity="0.4" />
              <rect x="244" y="288" width="6" height="9" opacity="0.65" />
              <rect x="280" y="288" width="6" height="9" opacity="0.45" />
              <rect x="316" y="288" width="6" height="9" opacity="0.7" />
              <rect x="226" y="314" width="6" height="9" opacity="0.5" />
              <rect x="262" y="314" width="6" height="9" opacity="0.6" />
              <rect x="298" y="314" width="6" height="9" opacity="0.4" />
              <rect x="244" y="340" width="6" height="9" opacity="0.7" />
              <rect x="280" y="340" width="6" height="9" opacity="0.55" />
              <rect x="316" y="340" width="6" height="9" opacity="0.45" />
              <rect x="340" y="278" width="4" height="6" opacity="0.55" />
              <rect x="352" y="278" width="4" height="6" opacity="0.65" />
              <rect x="364" y="278" width="4" height="6" opacity="0.45" />
              <rect x="376" y="278" width="4" height="6" opacity="0.7" />
              <rect x="340" y="298" width="4" height="6" opacity="0.4" />
              <rect x="364" y="298" width="4" height="6" opacity="0.55" />
              <rect x="376" y="298" width="4" height="6" opacity="0.5" />
              <rect x="352" y="320" width="4" height="6" opacity="0.65" />
              <rect x="376" y="320" width="4" height="6" opacity="0.45" />
              <rect x="340" y="342" width="4" height="6" opacity="0.6" />
              <rect x="364" y="342" width="4" height="6" opacity="0.5" />
            </g>
          </g>
          <g fill="#1F0F08">
            <ellipse cx="32" cy="300" rx="7" ry="60" />
            <ellipse cx="58" cy="318" rx="5" ry="42" />
            <ellipse cx="78" cy="328" rx="4" ry="32" />
            <ellipse cx="420" cy="305" rx="7" ry="55" />
            <ellipse cx="446" cy="320" rx="5" ry="40" />
            <ellipse cx="462" cy="330" rx="4" ry="30" />
          </g>
          <rect y="170" width="480" height="190" fill="url(#darken)" />
        </svg>

        <div style={{
          position: 'absolute',
          bottom: 40, left: 24, right: 24,
          color: 'white',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            opacity: 0.85, marginBottom: 10,
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 18, height: 1, background: 'rgba(255,255,255,0.6)' }} />
            {BUILDING_LOCATION}
          </div>
          <h1 style={{
            fontFamily: 'var(--display)',
            fontSize: 44, fontWeight: 400,
            margin: 0, letterSpacing: '-0.025em',
            lineHeight: 0.95,
          }}>
            Empress<br />Residence
          </h1>
          <div style={{
            marginTop: 14,
            fontSize: 12,
            opacity: 0.9,
            fontWeight: 500,
          }}>
            Repair requests · Residents portal
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--paper)',
        marginTop: -24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        position: 'relative',
        padding: '28px 20px 40px',
        flex: 1,
        boxShadow: '0 -8px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--line)',
          margin: '0 auto 22px',
        }} />

        {error && (
          <div style={{
            padding: '10px 12px', borderRadius: 8, background: '#F5DCDC',
            color: '#9B2C2C', fontSize: 12, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertCircle size={14} strokeWidth={2} />
            Could not reach the server. Check your connection.
          </div>
        )}

        <p style={{
          fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase',
          letterSpacing: '0.1em', margin: '0 0 12px', fontWeight: 600
        }}>
          Sign in as resident
        </p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24
        }}>
          {APARTMENTS.map((n) => (
            <button
              key={n}
              onClick={() => onLogin({ role: 'resident', apartment: n })}
              style={{
                aspectRatio: '1', borderRadius: 12, border: '1px solid var(--line)',
                background: 'var(--surface)', cursor: 'pointer', fontFamily: 'var(--display)',
                fontSize: 20, fontWeight: 500, color: 'var(--ink)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--ink)';
                e.currentTarget.style.color = 'var(--paper)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface)';
                e.currentTarget.style.color = 'var(--ink)';
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <p style={{
          fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase',
          letterSpacing: '0.1em', margin: '0 0 12px', fontWeight: 600
        }}>
          Building management
        </p>
        <button
          onClick={() => onLogin({ role: 'management' })}
          style={{
            width: '100%', padding: '16px 18px', borderRadius: 12,
            border: '1px solid var(--accent)', background: 'var(--accent)',
            color: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <Wrench size={18} strokeWidth={1.8} />
          Sign in as management
        </button>

        <p style={{
          fontSize: 11, color: 'var(--ink-muted)', textAlign: 'center',
          margin: '28px 0 0', lineHeight: 1.6, letterSpacing: '0.02em',
        }}>
          {APARTMENTS.length} apartments · Built 2019<br />
          <span style={{ opacity: 0.7 }}>800 m from the Mediterranean</span>
        </p>
      </div>
    </Shell>
  );
}

// ============================================================
// LIST VIEW
// ============================================================
function ListView({ user, requests, loading, error, onLogout, onNew, onOpen }) {
  const [filter, setFilter] = useState('active');

  const isManagement = user.role === 'management';

  let visible = requests;
  if (filter === 'active') visible = requests.filter(r => r.status === 'new' || r.status === 'in_progress');
  else if (filter === 'done') visible = requests.filter(r => r.status === 'done');
  else if (filter === 'rejected') visible = requests.filter(r => r.status === 'rejected');

  const stats = {
    new: requests.filter(r => r.status === 'new').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    done: requests.filter(r => r.status === 'done').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <Shell>
      <header style={{
        padding: '20px 20px 16px', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, background: 'var(--ink)',
          color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isManagement
            ? <Wrench size={18} strokeWidth={1.8} />
            : <Home size={18} strokeWidth={1.8} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase',
            letterSpacing: '0.08em', fontWeight: 600,
          }}>
            {isManagement ? 'Building management' : `Apartment ${user.apartment}`}
          </div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>
            {BUILDING_NAME}
          </div>
        </div>
        <button
          onClick={onLogout}
          aria-label="Sign out"
          style={{
            width: 38, height: 38, borderRadius: 10, border: '1px solid var(--line)',
            background: 'transparent', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)',
          }}
        >
          <LogOut size={16} strokeWidth={1.8} />
        </button>
      </header>

      <div style={{ padding: '16px 20px 0' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
        }}>
          <StatCard label="New" value={stats.new} color={STATUS.new.color} bg={STATUS.new.bg} />
          <StatCard label="Active" value={stats.in_progress} color={STATUS.in_progress.color} bg={STATUS.in_progress.bg} />
          <StatCard label="Done" value={stats.done} color={STATUS.done.color} bg={STATUS.done.bg} />
          <StatCard label="Rejected" value={stats.rejected} color={STATUS.rejected.color} bg={STATUS.rejected.bg} />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 16, marginBottom: 4 }}>
          {[
            { id: 'active', label: 'Active' },
            { id: 'done', label: 'Done' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              style={{
                flex: 1, padding: '8px 6px', borderRadius: 8,
                border: 'none', background: filter === t.id ? 'var(--ink)' : 'transparent',
                color: filter === t.id ? 'var(--paper)' : 'var(--ink-muted)',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main style={{ padding: '12px 20px 100px', flex: 1 }}>
        {error && !loading && (
          <div style={{
            padding: '12px 14px', borderRadius: 10, background: '#F5DCDC',
            color: '#9B2C2C', fontSize: 13, marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertCircle size={16} strokeWidth={2} />
            Could not load data. Will retry in 10 seconds.
          </div>
        )}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40, color: 'var(--ink-muted)' }}>
            <Loader2 className="spin" size={20} />
          </div>
        )}
        {!loading && visible.length === 0 && (
          <EmptyState filter={filter} isManagement={isManagement} />
        )}
        {!loading && visible.map(r => (
          <RequestCard key={r.id} request={r} currentUser={user} onClick={() => onOpen(r)} />
        ))}
      </main>

      {!isManagement && (
        <button
          onClick={onNew}
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            padding: '14px 24px', borderRadius: 999,
            background: 'var(--accent)', color: 'white', border: 'none',
            cursor: 'pointer', fontSize: 15, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 6px 24px rgba(184, 70, 46, 0.35)',
            zIndex: 10,
          }}
        >
          <Plus size={18} strokeWidth={2} />
          New request
        </button>
      )}
    </Shell>
  );
}

function StatCard({ label, value, color, bg }) {
  return (
    <div style={{
      padding: '10px 8px', borderRadius: 10, background: bg,
    }}>
      <div style={{
        fontFamily: 'var(--display)', fontSize: 22, fontWeight: 500,
        color, lineHeight: 1, marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color, opacity: 0.8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
    </div>
  );
}

function EmptyState({ filter, isManagement }) {
  const messages = {
    active: 'No active requests',
    done: 'No completed requests',
    rejected: 'No rejected requests',
    all: 'No requests yet',
  };
  const sub = isManagement
    ? 'Waiting for residents to submit.'
    : 'Tap "New request" to submit one.';
  return (
    <div style={{
      textAlign: 'center', padding: '60px 20px', color: 'var(--ink-muted)',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14, background: 'var(--surface)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16, border: '1px solid var(--line)',
      }}>
        <MessageSquare size={22} strokeWidth={1.5} />
      </div>
      <p style={{ fontSize: 14, margin: 0, lineHeight: 1.6 }}>
        {messages[filter] || messages.all}
        {filter === 'all' && <><br /><span style={{ fontSize: 12 }}>{sub}</span></>}
      </p>
    </div>
  );
}

function RequestCard({ request, currentUser, onClick }) {
  const status = STATUS[request.status];
  const StatusIcon = status.icon;
  const overdue = request.deadline && request.status !== 'done' && request.status !== 'rejected' && new Date(request.deadline) < new Date();
  const isOwn = currentUser?.role === 'resident' && currentUser.apartment === request.apartment;

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', display: 'block',
        padding: '14px 14px', marginBottom: 8, borderRadius: 12,
        border: isOwn ? '1px solid var(--ink)' : '1px solid var(--line)',
        background: 'var(--surface)',
        cursor: 'pointer', transition: 'transform 0.1s',
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.99)'}
      onMouseUp={(e) => e.currentTarget.style.transform = ''}
      onMouseLeave={(e) => e.currentTarget.style.transform = ''}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 6,
          background: status.bg, color: status.color,
          fontSize: 11, fontWeight: 600,
        }}>
          <StatusIcon size={11} strokeWidth={2.5} />
          {status.label}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: isOwn ? 'var(--ink)' : 'var(--ink-muted)',
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          Apt. {request.apartment}{isOwn ? ' · You' : ''}
        </span>
        {request.photoUrl && (
          <ImageIcon size={12} color="var(--ink-muted)" strokeWidth={2} />
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-muted)' }}>
          {fmtDate(request.createdAt)}
        </span>
      </div>
      <div style={{
        fontFamily: 'var(--display)', fontSize: 16, fontWeight: 500,
        color: 'var(--ink)', marginBottom: 4, lineHeight: 1.3,
      }}>
        {request.title}
      </div>
      <div style={{
        fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.4,
        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>
        {request.description}
      </div>
      {request.deadline && request.status !== 'rejected' && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          marginTop: 8, fontSize: 12,
          color: overdue ? '#B8462E' : 'var(--ink-muted)',
          fontWeight: overdue ? 600 : 400,
        }}>
          <Calendar size={12} strokeWidth={2} />
          {overdue ? 'Overdue · ' : 'Due: '}{fmtDate(request.deadline)}
        </div>
      )}
    </button>
  );
}

// ============================================================
// NEW REQUEST FORM
// ============================================================
function NewRequestForm({ apartment, onCancel, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const fileRef = useRef(null);

  // Free object URLs on unmount or change
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    try {
      const blob = await compressImage(file);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoBlob(blob);
      setPhotoPreview(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
    } finally {
      setPhotoLoading(false);
    }
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoBlob(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit() {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        photoBlob,
      });
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Submission failed');
      setSubmitting(false);
    }
  }

  const valid = title.trim().length > 0;

  return (
    <Shell>
      <header style={{
        padding: '20px 20px 16px', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={onCancel}
          aria-label="Back"
          style={{
            width: 36, height: 36, borderRadius: 10, border: '1px solid var(--line)',
            background: 'transparent', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--ink)',
          }}
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <div>
          <div style={{
            fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase',
            letterSpacing: '0.08em', fontWeight: 600,
          }}>
            Apartment {apartment}
          </div>
          <h2 style={{
            fontFamily: 'var(--display)', fontSize: 20, fontWeight: 500,
            color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
          }}>
            New request
          </h2>
        </div>
      </header>

      <main style={{ padding: 20, flex: 1 }}>
        <Field label="What's the issue?" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Briefly: leaky tap, broken intercom…"
            maxLength={80}
            style={inputStyle}
          />
        </Field>

        <Field label="Details">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Where, when you noticed it, what you've already tried…"
            rows={4}
            maxLength={500}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 90, fontFamily: 'inherit' }}
          />
        </Field>

        <Field label="Photo">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            style={{ display: 'none' }}
          />
          {!photoPreview && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={photoLoading}
              style={{
                width: '100%', padding: '16px', borderRadius: 12,
                border: '1px dashed var(--line)', background: 'var(--surface)',
                cursor: 'pointer', color: 'var(--ink-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontSize: 14,
              }}
            >
              {photoLoading
                ? <><Loader2 className="spin" size={18} /> Processing…</>
                : <><Camera size={18} strokeWidth={1.8} /> Add photo</>}
            </button>
          )}
          {photoPreview && (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
              <img src={photoPreview} alt="" style={{ width: '100%', display: 'block', maxHeight: 320, objectFit: 'cover' }} />
              <button
                onClick={clearPhoto}
                aria-label="Remove photo"
                style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 32, height: 32, borderRadius: 999,
                  background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
          )}
        </Field>

        {submitError && (
          <div style={{
            padding: '10px 12px', borderRadius: 8, background: '#F5DCDC',
            color: '#9B2C2C', fontSize: 12, marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertCircle size={14} strokeWidth={2} />
            {submitError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!valid || submitting}
          style={{
            width: '100%', padding: '14px 18px', borderRadius: 12, border: 'none',
            background: valid ? 'var(--accent)' : 'var(--line)',
            color: 'white', cursor: valid ? 'pointer' : 'not-allowed',
            fontSize: 15, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 16,
          }}
        >
          {submitting
            ? <><Loader2 className="spin" size={16} /> Submitting…</>
            : <><Send size={16} strokeWidth={2} /> Submit request</>}
        </button>
      </main>
    </Shell>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600,
        color: 'var(--ink)', marginBottom: 6,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {label}{required && <span style={{ color: 'var(--accent)' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: '1px solid var(--line)', background: 'var(--surface)',
  fontSize: 15, color: 'var(--ink)', boxSizing: 'border-box',
  outline: 'none', fontFamily: 'inherit',
};

// ============================================================
// REQUEST DETAIL
// ============================================================
function RequestDetail({ request, user, onBack, onUpdate, onDelete }) {
  const [note, setNote] = useState(request.managementNote || '');
  const [deadline, setDeadline] = useState(request.deadline ? request.deadline.split('T')[0] : '');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);

  const isManagement = user.role === 'management';
  const status = STATUS[request.status];
  const StatusIcon = status.icon;

  useEffect(() => {
    setNote(request.managementNote || '');
    setDeadline(request.deadline ? request.deadline.split('T')[0] : '');
    setRejectMode(false);
  }, [request.id, request.managementNote, request.deadline]);

  async function changeStatus(newStatus) {
    const updates = { status: newStatus };
    if (newStatus === 'in_progress' && deadline) {
      updates.deadline = new Date(deadline + 'T12:00:00').toISOString();
    }
    if (note && note !== request.managementNote) {
      updates.managementNote = note;
    }
    await onUpdate(updates);
  }

  return (
    <Shell>
      <header style={{
        padding: '20px 20px 16px', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={onBack}
          aria-label="Back"
          style={{
            width: 36, height: 36, borderRadius: 10, border: '1px solid var(--line)',
            background: 'transparent', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--ink)',
          }}
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase',
            letterSpacing: '0.08em', fontWeight: 600,
          }}>
            Request · Apt. {request.apartment}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            created {fmtDateTime(request.createdAt)}
          </div>
        </div>
      </header>

      <main style={{ padding: 20, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 7,
            background: status.bg, color: status.color,
            fontSize: 12, fontWeight: 600,
          }}>
            <StatusIcon size={12} strokeWidth={2.5} />
            {status.label}
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--display)', fontSize: 26, fontWeight: 500,
          color: 'var(--ink)', margin: '0 0 12px', letterSpacing: '-0.015em',
          lineHeight: 1.2,
        }}>
          {request.title}
        </h1>

        {request.description && (
          <p style={{
            fontSize: 15, color: 'var(--ink)', lineHeight: 1.55,
            margin: '0 0 20px', whiteSpace: 'pre-wrap',
          }}>
            {request.description}
          </p>
        )}

        {request.photoUrl && (
          <div style={{
            borderRadius: 12, overflow: 'hidden', marginBottom: 20,
            background: 'var(--surface)', border: '1px solid var(--line)',
          }}>
            <img src={request.photoUrl} alt="" style={{ width: '100%', display: 'block' }} loading="lazy" />
          </div>
        )}

        {isManagement && (
          <div style={{
            padding: 16, borderRadius: 12, background: 'var(--surface)',
            border: '1px solid var(--line)', marginBottom: 16,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
            }}>
              Manage request
            </div>

            <Field label="Due date">
              <input
                type="date"
                value={deadline}
                min={todayInputValue()}
                onChange={(e) => setDeadline(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label={rejectMode ? 'Reason for rejection (required)' : 'Management note'}>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={rejectMode
                  ? 'Explain why this request is being rejected…'
                  : "What's been done, next steps…"}
                rows={3}
                maxLength={300}
                autoFocus={rejectMode}
                style={{
                  ...inputStyle, resize: 'vertical', fontFamily: 'inherit',
                  borderColor: rejectMode ? '#9B2C2C' : 'var(--line)',
                }}
              />
            </Field>

            {rejectMode ? (
              <div>
                <div style={{
                  padding: '10px 12px', borderRadius: 8, background: '#F5DCDC',
                  color: '#9B2C2C', fontSize: 12, fontWeight: 500, marginBottom: 12,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <AlertCircle size={14} strokeWidth={2} />
                  The reason will be shown to the resident.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setRejectMode(false); setNote(request.managementNote || ''); }}
                    style={secondaryBtn()}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!note.trim()) return;
                      await onUpdate({ status: 'rejected', managementNote: note.trim() });
                      setRejectMode(false);
                      onBack();
                    }}
                    disabled={!note.trim()}
                    style={{
                      ...primaryBtn('#9B2C2C'),
                      opacity: note.trim() ? 1 : 0.5,
                      cursor: note.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <X size={16} strokeWidth={2} /> Confirm rejection
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                {(request.status === 'new' || request.status === 'in_progress') && (
                  <>
                    <button
                      onClick={async () => { await changeStatus('in_progress'); onBack(); }}
                      style={compactBtn('var(--navy)')}
                    >
                      <Clock size={14} strokeWidth={2} /> Take on
                    </button>
                    <button
                      onClick={() => setRejectMode(true)}
                      style={compactBtn('#9B2C2C')}
                    >
                      <X size={14} strokeWidth={2} /> Reject
                    </button>
                    <button
                      onClick={async () => { await changeStatus('done'); onBack(); }}
                      style={compactBtn('var(--green)')}
                    >
                      <Check size={14} strokeWidth={2} /> Done
                    </button>
                  </>
                )}
                {request.status === 'done' && (
                  <button
                    onClick={async () => { await changeStatus('in_progress'); onBack(); }}
                    style={secondaryBtn()}
                  >
                    Reopen
                  </button>
                )}
                {request.status === 'rejected' && (
                  <button
                    onClick={async () => { await changeStatus('new'); onBack(); }}
                    style={secondaryBtn()}
                  >
                    Reopen
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Management note / rejection reason shown to resident */}
        {!isManagement && request.managementNote && (
          <div style={{
            padding: 14, borderRadius: 12,
            background: request.status === 'rejected' ? '#F5DCDC' : 'var(--surface)',
            border: request.status === 'rejected' ? '1px solid #E5B8B8' : '1px solid var(--line)',
            marginBottom: 16,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600,
              color: request.status === 'rejected' ? '#9B2C2C' : 'var(--ink-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
            }}>
              {request.status === 'rejected' ? 'Rejection reason' : 'Management note'}
            </div>
            <div style={{
              fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap',
              color: request.status === 'rejected' ? '#5C1818' : 'var(--ink)',
            }}>
              {request.managementNote}
            </div>
          </div>
        )}

        {!isManagement && request.deadline && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 14px', borderRadius: 10,
            background: 'var(--surface)', border: '1px solid var(--line)',
            marginBottom: 16, fontSize: 14, color: 'var(--ink)',
          }}>
            <Calendar size={16} strokeWidth={1.8} color="var(--ink-muted)" />
            Due date: <strong>{fmtDate(request.deadline)}</strong>
          </div>
        )}

        {(isManagement || (request.apartment === user.apartment && request.status === 'new')) && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            {!showConfirmDelete ? (
              <button
                onClick={() => setShowConfirmDelete(true)}
                style={{
                  background: 'none', border: 'none', color: 'var(--ink-muted)',
                  fontSize: 13, cursor: 'pointer', padding: 8,
                  textDecoration: 'underline',
                }}
              >
                Delete request
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  onClick={onDelete}
                  style={{
                    padding: '8px 14px', borderRadius: 8, border: 'none',
                    background: '#B8462E', color: 'white', cursor: 'pointer', fontSize: 13,
                  }}
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, border: '1px solid var(--line)',
                    background: 'transparent', color: 'var(--ink)', cursor: 'pointer', fontSize: 13,
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </Shell>
  );
}

function primaryBtn(bg) {
  return {
    flex: 1, padding: '12px 14px', borderRadius: 10, border: 'none',
    background: bg, color: 'white', cursor: 'pointer',
    fontSize: 14, fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  };
}
function compactBtn(bg) {
  return {
    flex: 1, padding: '11px 6px', borderRadius: 10, border: 'none',
    background: bg, color: 'white', cursor: 'pointer',
    fontSize: 13, fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  };
}
function secondaryBtn() {
  return {
    flex: 1, padding: '12px 14px', borderRadius: 10,
    border: '1px solid var(--line)', background: 'transparent',
    color: 'var(--ink)', cursor: 'pointer', fontSize: 14, fontWeight: 500,
  };
}

// ============================================================
// SHELL (shared layout + styles)
// ============================================================
function Shell({ children }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=DM+Sans:wght@400;500;600&display=swap');
        :root {
          --paper: #F5EFE6;
          --surface: #FDFBF7;
          --ink: #1F1A14;
          --ink-muted: #7A6F5F;
          --line: #E3D9C9;
          --accent: #B8462E;
          --navy: #1E3A5F;
          --green: #4A6B3A;
          --display: 'Fraunces', Georgia, serif;
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
        .app-root {
          font-family: 'DM Sans', -apple-system, sans-serif;
          color: var(--ink);
          background: var(--paper);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }
        .app-container {
          max-width: 480px;
          margin: 0 auto;
          min-height: 100vh;
          background: var(--paper);
          display: flex;
          flex-direction: column;
          position: relative;
        }
        @media (min-width: 481px) {
          .app-container {
            box-shadow: 0 0 0 1px var(--line);
          }
        }
        input:focus, textarea:focus {
          border-color: var(--ink) !important;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
      <div className="app-root">
        <div className="app-container">
          {children}
        </div>
      </div>
    </>
  );
}
