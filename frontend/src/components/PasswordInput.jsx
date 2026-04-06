import { useState } from 'react';

// Jelszó erősség kritériumok
export const PW_RULES = [
  { id: 'len',   label: 'Legalább 8 karakter',  test: v => v.length >= 8 },
  { id: 'upper', label: 'Nagybetű (A–Z)',        test: v => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Kisbetű (a–z)',         test: v => /[a-z]/.test(v) },
  { id: 'num',   label: 'Szám (0–9)',            test: v => /[0-9]/.test(v) },
];

export function checkPassword(value) {
  return PW_RULES.map(r => ({ ...r, ok: r.test(value) }));
}

export function isPasswordValid(value) {
  return PW_RULES.every(r => r.test(value));
}

// Jelszó erősség indikátor (csak ha a mező nem üres és nem teljesül minden)
export function PasswordStrength({ value }) {
  if (!value) return null;
  const rules = checkPassword(value);
  const allOk = rules.every(r => r.ok);
  if (allOk) return null; // Ha minden OK, ne mutasson semmit

  return (
    <ul className="pw-strength-list">
      {rules.map(r => (
        <li key={r.id} className={`pw-strength-item ${r.ok ? 'ok' : 'fail'}`}>
          <span className="pw-strength-icon">{r.ok ? '✓' : '✗'}</span>
          {r.label}
        </li>
      ))}
    </ul>
  );
}

// Jelszó input szem ikonnal
export function PasswordInput({ id, value, onChange, placeholder, disabled, className }) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-wrapper">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder || '••••••••'}
        disabled={disabled}
        className={className}
        required
      />
      {value.length > 0 && (
        <button
          type="button"
          className="toggle-pw"
          onClick={() => setShow(v => !v)}
          tabIndex={-1}
          aria-label={show ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
