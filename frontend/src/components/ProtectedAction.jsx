import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProtectedAction({ children, onClick }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleClick = () => {
    if (!user) return navigate('/login');
    onClick();
  };

  return <div onClick={handleClick}>{children}</div>;
}