'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, ShieldCheck, KeyRound, Delete, ArrowRight, Check, AlertCircle } from 'lucide-react';

export function LockScreen() {
  const { isPinSet, unlockWithPin, setupNewPin } = useAuth();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirmingStep, setIsConfirmingStep] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Trigger error animation and feedback
  const triggerError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setIsShaking(true);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([50, 50, 50]);
    }
    setTimeout(() => {
      setIsShaking(false);
      setPin('');
      setConfirmPin('');
      setIsConfirmingStep(false);
    }, 600);
  }, []);

  // Handle number click on keypad
  const handleDigit = useCallback((digit: string) => {
    setErrorMsg('');
    if (pin.length < 8) {
      setPin((prev) => prev + digit);
    }
  }, [pin]);

  // Handle backspace
  const handleDelete = useCallback(() => {
    setErrorMsg('');
    setPin((prev) => prev.slice(0, -1));
  }, []);

  // Process PIN submission
  const handleAction = useCallback(async (pinToTest: string) => {
    if (!pinToTest || pinToTest.length < 4) {
      triggerError('El PIN debe tener al menos 4 dígitos');
      return;
    }

    if (!isPinSet) {
      // First time Setup Mode
      if (!isConfirmingStep) {
        setConfirmPin(pinToTest);
        setPin('');
        setIsConfirmingStep(true);
        setErrorMsg('');
      } else {
        // Confirmation check
        if (pinToTest === confirmPin) {
          setIsSuccess(true);
          setTimeout(async () => {
            await setupNewPin(pinToTest);
          }, 300);
        } else {
          triggerError('Los PINs no coinciden. Inténtalo de nuevo');
        }
      }
    } else {
      // Normal Unlock Mode
      const success = await unlockWithPin(pinToTest);
      if (success) {
        setIsSuccess(true);
      } else {
        triggerError('PIN incorrecto. Acceso denegado');
      }
    }
  }, [confirmPin, isConfirmingStep, isPinSet, setupNewPin, triggerError, unlockWithPin]);

  // Auto-submit when user reaches 4 digits if normal unlock
  useEffect(() => {
    if (isPinSet && pin.length >= 4 && !errorMsg) {
      const timer = setTimeout(() => {
        handleAction(pin);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pin, isPinSet, errorMsg, handleAction]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        handleAction(pin);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleAction, pin]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-zinc-800">
      <div
        className={`w-full max-w-sm flex flex-col items-center text-center transition-all ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Shield Icon Badge */}
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white mb-6 shadow-2xl relative">
          {isSuccess ? (
            <Check className="w-8 h-8 text-emerald-400 animate-in zoom-in-50" />
          ) : !isPinSet ? (
            <KeyRound className="w-7 h-7 text-white" />
          ) : (
            <Lock className="w-7 h-7 text-zinc-200" />
          )}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black" />
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {!isPinSet
            ? !isConfirmingStep
              ? 'Crea tu PIN de Acceso'
              : 'Confirma tu PIN'
            : 'MisArchivos Protegido'}
        </h1>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs">
          {!isPinSet
            ? !isConfirmingStep
              ? 'Elige un PIN de 4 a 6 dígitos para proteger tus archivos personales.'
              : 'Escribe de nuevo tu PIN para guardarlo.'
            : 'Ingresa tu PIN para desbloquear el sistema personal.'}
        </p>

        {/* PIN Dot Indicators */}
        <div className="flex items-center justify-center gap-3 my-7">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  isSuccess
                    ? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-500/50'
                    : isFilled
                    ? 'bg-white scale-125 shadow-md shadow-white/30'
                    : 'bg-zinc-800 border border-zinc-700'
                }`}
              />
            );
          })}
          {pin.length > 4 && (
            <span className="text-[10px] text-zinc-400 font-mono pl-1">
              +{pin.length - 4}
            </span>
          )}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 px-3.5 py-1.5 rounded-xl mb-4 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* On-screen OLED Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-16 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 active:scale-95 text-xl font-bold text-white transition-all shadow-md flex items-center justify-center cursor-pointer select-none"
            >
              {digit}
            </button>
          ))}

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 active:scale-95 text-zinc-400 hover:text-white transition-all flex items-center justify-center cursor-pointer select-none"
            title="Borrar"
          >
            <Delete className="w-5 h-5" />
          </button>

          {/* 0 Button */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 active:scale-95 text-xl font-bold text-white transition-all shadow-md flex items-center justify-center cursor-pointer select-none"
          >
            0
          </button>

          {/* Enter / Submit Button */}
          <button
            type="button"
            onClick={() => handleAction(pin)}
            className="h-16 rounded-2xl bg-white hover:bg-zinc-200 text-black active:scale-95 font-bold transition-all flex items-center justify-center cursor-pointer shadow-md select-none"
            title="Aceptar"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Security Footnote */}
        <div className="mt-8 flex items-center gap-1.5 text-[11px] text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>Cifrado SHA-256 local & Acceso personal</span>
        </div>
      </div>
    </div>
  );
}
