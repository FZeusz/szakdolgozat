import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Ez a NYILVÁNOS FŐOLDAL (Landing)</h1>
      <p>Itt mindenki látja a reklámszöveget.</p>
      <nav>
        <Link to="/login"><button>Bejelentkezés</button></Link>
        <Link to="/register"><button style={{ marginLeft: '10px' }}>Regisztráció</button></Link>
      </nav>
    </div>
  );
}