import { Link } from 'react-router-dom';

export default function Register() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>REGISZTRÁCIÓ OLDAL</h1>
      <p>Itt tudsz majd fiókot létrehozni.</p>
      <Link to="/login">Már van fiókom, belépek</Link>
      <br /><br />
      <Link to="/">Vissza a főoldalra</Link>
    </div>
  );
}