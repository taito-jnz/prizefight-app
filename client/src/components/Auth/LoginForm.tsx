import { useState } from 'react';
import { signInUser, signUpUser } from '../../services/authService';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInUser(email, password);
      } else {
        await signUpUser(email, password);
      }
      
      onLoginSuccess();
    } catch (err: any) {
      let errorMessage = 'Authentication failed. Please try again.';
      
      // Extract Firebase auth error message
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          {isLogin ? '🔑 Log in to Prizefight' : '✨ Create an Account'}
        </h2>
        
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="form-input auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-input auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {!isLogin && (
              <small className="password-hint">Password must be at least 6 characters</small>
            )}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isLoading}
          >
            {isLoading 
              ? 'Loading...' 
              : isLogin 
                ? 'Log In' 
                : 'Sign Up'
            }
          </button>
        </form>
        
        <div className="auth-toggle">
          <p>
            {isLogin 
              ? "Don't have an account?" 
              : "Already have an account?"
            }
            <button 
              type="button" 
              className="auth-toggle-btn" 
              onClick={toggleAuthMode}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;