'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Cryptographic hash helper for client PIN
export async function hashPin(pin: string): Promise<string> {
  const salt = 'misarchivos_secure_salt_2026';
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface AuthContextType {
  isAuthenticated: boolean;
  isPinSet: boolean;
  unlockWithPin: (pin: string) => Promise<boolean>;
  setupNewPin: (pin: string) => Promise<void>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  lockApp: () => void;
  resetAllSecurity: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PIN_STORAGE_KEY = 'misarchivos_pin_hash';
const SESSION_AUTH_KEY = 'misarchivos_is_authenticated';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isPinSet, setIsPinSet] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Check if env PIN or stored PIN exists on startup
  useEffect(() => {
    const envPin = process.env.NEXT_PUBLIC_APP_PIN;
    const storedPinHash = localStorage.getItem(PIN_STORAGE_KEY);
    const sessionAuth = sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';

    if (envPin || storedPinHash) {
      setIsPinSet(true);
      if (sessionAuth) {
        setIsAuthenticated(true);
      }
    } else {
      // First time use: no PIN set yet
      setIsPinSet(false);
      setIsAuthenticated(false);
    }
    setIsLoaded(true);
  }, []);

  const unlockWithPin = async (pin: string): Promise<boolean> => {
    const envPin = process.env.NEXT_PUBLIC_APP_PIN;
    const storedPinHash = localStorage.getItem(PIN_STORAGE_KEY);

    // If env PIN is defined
    if (envPin && pin.trim() === envPin.trim()) {
      setIsAuthenticated(true);
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      return true;
    }

    // Check stored hashed PIN
    if (storedPinHash) {
      const enteredHash = await hashPin(pin.trim());
      if (enteredHash === storedPinHash) {
        setIsAuthenticated(true);
        sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
        return true;
      }
    }

    return false;
  };

  const setupNewPin = async (pin: string): Promise<void> => {
    const hashed = await hashPin(pin.trim());
    localStorage.setItem(PIN_STORAGE_KEY, hashed);
    setIsPinSet(true);
    setIsAuthenticated(true);
    sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
  };

  const changePin = async (oldPin: string, newPin: string): Promise<boolean> => {
    const storedPinHash = localStorage.getItem(PIN_STORAGE_KEY);
    const envPin = process.env.NEXT_PUBLIC_APP_PIN;

    let isOldValid = false;
    if (envPin && oldPin.trim() === envPin.trim()) {
      isOldValid = true;
    } else if (storedPinHash) {
      const oldHash = await hashPin(oldPin.trim());
      if (oldHash === storedPinHash) {
        isOldValid = true;
      }
    }

    if (isOldValid) {
      const newHash = await hashPin(newPin.trim());
      localStorage.setItem(PIN_STORAGE_KEY, newHash);
      return true;
    }

    return false;
  };

  const lockApp = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  };

  const resetAllSecurity = () => {
    localStorage.removeItem(PIN_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    setIsPinSet(false);
    setIsAuthenticated(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isPinSet,
        unlockWithPin,
        setupNewPin,
        changePin,
        lockApp,
        resetAllSecurity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
