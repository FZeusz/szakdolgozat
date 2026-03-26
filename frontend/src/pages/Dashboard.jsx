import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>VEZÉRLŐPULT (Belső oldal)</h1>
      <p>Szia! Te már be vagy jelentkezve (elméletileg).</p>
      <Link to="/"><button>Kijelentkezés</button></Link>
    </div>
  );
}