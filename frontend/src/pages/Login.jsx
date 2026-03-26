import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

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
    <div style={{ padding: '20px' }}>
      <h1>Bejelentkezés</h1>
      <form onSubmit={handleLogin}>
        <input 
          type="text" 
          placeholder="Felhasználónév" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required 
        /><br /><br />
        <input 
          type="password" 
          placeholder="Jelszó" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
        /><br /><br />
        <button type="submit">Belépés</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <br />
      <Link to="/">Vissza a főoldalra</Link>
    </div>
  );
}