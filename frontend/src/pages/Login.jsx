import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// Alap stílus a szövegdobozokhoz (NEM lekerekített)
const inputStyle = {
  width: '100%',             // Teljes szélesség a konténeren belül
  padding: '12px',           // Belső távolság (kényelmesebb gépelés)
  border: '1px solid #ccc',   // Halvány szürke keret
  boxSizing: 'border-box',    // Biztosítja, hogy a padding ne növelje a szélességet
  marginTop: '5px',           // Távolság a fenti labeltől
  marginBottom: '15px'        // Távolság a következő mezőtől
};

// Stílus a Label szövegekhez (a mező felett)
const labelStyle = {
  display: 'block',           // Külön sorba teszi a labelt
  fontWeight: 'bold',         // Vastagított szöveg (mint a képen)
  fontSize: '14px',           // Picit kisebb szöveg
  textAlign: 'left'           // Balra igazítás
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Megakadályozzuk az oldal újratöltését
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Ha sikeres, elmentjük a felhasználót és irány a Dashboard!
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Nem sikerült elérni a szervert!");
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Bejelentkezés</h1>
      <form onSubmit={handleLogin}>
        
        {/* HIBRID AZONOSÍTÓ MEZŐ */}
        <div style={{ textAlign: 'left' }}>
          {/* Itt a label jelzi, hogy mindkettőt elfogadja */}
          <label style={labelStyle} htmlFor="login_id">Felhasználónév vagy Email</label>
          <input 
            id="login_id"
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
            required 
          />
        </div>

        {/* JELSZÓ MEZŐ */}
        <div style={{ textAlign: 'left' }}>
          <label style={labelStyle} htmlFor="login_pass">Jelszó</label>
          <input 
            id="login_pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required 
          />
        </div>

        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', marginTop: '10px' }}>
          Bejelentkezés
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
      
      <br />
      <button onClick={() => navigate('/register')} style={{ padding: '10px 20px', cursor: 'pointer', marginTop: '10px' }}  >
        Új fiók létrehozása
      </button>
    </div>
  );
}