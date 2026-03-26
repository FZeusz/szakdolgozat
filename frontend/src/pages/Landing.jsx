import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate(); // Ezzel tudunk programozottan navigálni

  // Közös stílus a gomboknak (opcionális, hogy ne ismételd magad)
  const buttonStyle = {
    padding: '10px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Ez a NYILVÁNOS FŐOLDAL (Landing)</h1>
      <p>Itt mindenki látja a reklámszöveget.</p>
      
      <nav style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
        
        {/* VALÓDI GOMBOK */}
        <button 
          onClick={() => navigate('/login')} 
          style={{ ...buttonStyle, backgroundColor: '#007BFF' }}
        >
          Bejelentkezés
        </button>

        <button 
          onClick={() => navigate('/register')} 
          style={{ ...buttonStyle, backgroundColor: '#28a745' }}
        >
          Regisztráció
        </button>

      </nav>
    </div>
  );
}