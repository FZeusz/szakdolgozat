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

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Sikeres regisztráció! Átirányítás a bejelentkezéshez...");
        // Várunk 2 másodpercet, hogy elolvassa az üzenetet, majd átvisszük a loginra
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setIsError(true);
        setMessage(data.message);
      }
    } catch (err) {
      setIsError(true);
      setMessage("Nem sikerült elérni a szervert!");
    }
  };

  return (
    // Külső konténer, ami középre igazítja az egészet
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Regisztráció</h1>
      <form onSubmit={handleRegister}>
        
        {/* FELHASZNÁLÓNÉV MEZŐ */}
        <div style={{ textAlign: 'left' }}> {/* Konténer a label+input párosnak */}
          <label style={labelStyle} htmlFor="username">Felhasználónév</label>
          <input 
            id="username"
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle} // Alkalmazzuk az előre megírt stílust
            required 
          />
        </div>

        {/* EMAIL MEZŐ */}
        <div style={{ textAlign: 'left' }}>
          <label style={labelStyle} htmlFor="email">E-mail</label>
          <input 
            id="email"
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required 
          />
        </div>

        {/* JELSZÓ MEZŐ */}
        <div style={{ textAlign: 'left' }}>
          <label style={labelStyle} htmlFor="password">Jelszó</label>
          <input 
            id="password"
            type="password" 
            placeholder="Legalább 6 karakter" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required 
          />
        </div>

        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', marginTop: '10px' }}>
          Fiók létrehozása
        </button>
      </form>

      {message && (
        <p style={{ color: isError ? 'red' : 'green', marginTop: '15px' }}>
          {message}
        </p>
      )}
      
      <br />
      <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', cursor: 'pointer', marginTop: '10px' }}  >
        Már van fiókom
      </button>
    </div>
  );
}