import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Button, Input, Card } from '../components/ui';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await api.post('/auth/login', { email, password });
        const { token, admin } = response.data;
        login(token, admin);
        navigate('/dashboard');
      } else {
        const response = await api.post('/auth/register', { 
          email, 
          password, 
          restaurant_name: restaurantName, 
          address 
        });
        const { token, admin } = response.data;
        login(token, admin);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/40 via-background to-background p-4">
      <Card className="w-full max-w-md bg-ar-panel backdrop-blur-md border-border/50">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <span className="text-primary font-sora text-2xl font-bold">AR</span>
          </div>
          <h1 className="text-2xl font-sora font-bold text-text-primary mb-2">
            {isLogin ? 'Admin Portal' : 'Create Account'}
          </h1>
          <p className="text-text-muted text-sm">
            {isLogin ? 'Sign in to manage your interactive menu' : 'Register your restaurant for AR Menu'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {!isLogin && (
            <>
              <Input 
                label="Restaurant Name" 
                type="text" 
                placeholder="The Krusty Krab"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                required
              />
              <Input 
                label="Restaurant Address" 
                type="text" 
                placeholder="123 Ocean Avenue"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </>
          )}

          <Input 
            label="Email Address" 
            type="email" 
            placeholder="admin@arburger.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && <div className="text-error text-sm text-center">{error}</div>}
          
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? (isLogin ? 'Authenticating...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Sign Up')}
          </Button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-primary text-sm hover:underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
