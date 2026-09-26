import { Check } from 'lucide-react';
import BrandMark from '../components/BrandMark.jsx';

export default function LoginPage({ onLogin }) {
  return (
    <div className="login-screen">
      <div className="login-art">
        <div className="art-brand">
          <BrandMark />
          <span>stocksense</span>
        </div>
        <div className="art-copy">
          <span className="eyebrow">INVENTORY, IN SYNC</span>
          <h1>
            Make every
            <br />
            <em>move</em> count.
          </h1>
          <p>A calmer, clearer way to keep your stock moving.</p>
        </div>
        <div className="art-foot">
          <span>Your inventory workspace.</span>
        </div>
      </div>
      <div className="login-form">
        <div className="login-form-inner">
          <div className="mobile-brand">
            <BrandMark />
            <span>stocksense</span>
          </div>
          <div className="form-intro">
            <span className="eyebrow">WELCOME BACK</span>
            <h2>Sign in to your workspace</h2>
            <p>Enter your details to access your inventory.</p>
          </div>
          <label>
            Your email
            <input type="email" placeholder="Your email" />
          </label>
          <label>
            Password
            <div className="password-input">
              <input type="password" placeholder="Your password" />
              <button>Show</button>
            </div>
          </label>
          <div className="form-options">
            <label className="check-label">
              <input type="checkbox" defaultChecked />
              Keep me signed in
            </label>
            <button className="forgot">Forgot password?</button>
          </div>
          <button className="login-button" onClick={onLogin}>
            Sign in <span>→</span>
          </button>
          <div className="or">
            <span>or</span>
          </div>
          <button className="sso-button">
            <span className="google-g">G</span>Continue with Google
          </button>
          <p className="signup">
            Don't have an account? <button>Request access</button>
          </p>
        </div>
        <div className="security-note">
          <Check size={14} />
          Your data is encrypted and secure
        </div>
      </div>
    </div>
  );
}
