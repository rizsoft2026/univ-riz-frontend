import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';

import spaceBg from '@/assets/images/space_bg.jpg';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@uniriz.com');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin@uniriz.com' && password === '12345678') {
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/');
    } else {
      alert('Invalid credentials!');
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-end relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${spaceBg})` }}
    >
      {/* Brand Logo */}
      <div className="absolute top-8 left-12">
        <h1 className="text-white text-3xl font-extrabold tracking-[0.25em] uppercase" style={{ fontFamily: 'sans-serif' }}>
          UNIV-RIZ
        </h1>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[440px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 mr-12 shadow-2xl">
        
        {/* Tabs */}
        <div className="flex gap-8 mb-6">
          <div className="text-white text-2xl font-semibold border-b-2 border-blue-500 pb-1 cursor-pointer">
            Sign in
          </div>
        </div>

        {/* Welcome Text */}
        <p className="text-gray-200 text-lg mb-8 leading-snug">
          Welcome back! Please<br />login to your account
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div className="relative">
            <label className="absolute -top-2 left-3 bg-[#1e293b]/50 px-1 text-xs text-gray-300 backdrop-blur-sm rounded">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-gray-400 text-white rounded-lg px-4 py-3.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <label className="absolute -top-2 left-3 bg-[#1e293b]/50 px-1 text-xs text-gray-300 backdrop-blur-sm rounded">
              Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-gray-400 text-white rounded-lg px-4 py-3.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-200 focus:outline-none"
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between text-sm text-gray-300 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-400 bg-transparent text-blue-500 focus:ring-blue-500 focus:ring-offset-0 w-4 h-4" />
              Remember Me
            </label>
            <a href="#" className="hover:text-white transition-colors">
              Forget Password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-[#1e88e5] hover:bg-blue-500 text-white rounded-lg py-3.5 font-medium text-lg transition-colors mt-6 shadow-lg shadow-blue-500/30"
          >
            Login
          </button>
        </form>


        {/* OR Divider */}
        <div className="flex items-center justify-center my-6">
          <span className="text-xs text-gray-300 font-medium tracking-wide">OR</span>
        </div>

        {/* Social Logins */}
        <div className="flex items-center justify-center gap-4">
          <button type="button" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
            <FcGoogle size={20} />
          </button>
          <button type="button" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 text-blue-500">
            <FaFacebook size={20} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
