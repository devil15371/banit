import React, { useState } from 'react';
import { ShieldAlert, KeyRound, EyeOff, Lock } from 'lucide-react';

export default function DecoyCalculator({ onUnlockMesh, onDuressWipe }) {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [historySequence, setHistorySequence] = useState('');
  const [wipeNotice, setWipeNotice] = useState(false);

  const MASTER_PIN = '7378'; // Spells REST (Emergency mesh unlock)
  const DURESS_PIN = '911';  // Duress wipe trigger

  const handleDigit = (digit) => {
    setDisplay(prev => {
      const next = prev === '0' ? String(digit) : prev + digit;
      return next.slice(0, 10);
    });
    setHistorySequence(prev => (prev + digit).slice(-12));
  };

  const handleOp = (op) => {
    setPrevValue(parseFloat(display));
    setOperation(op);
    setDisplay('0');
    setHistorySequence(prev => (prev + op).slice(-12));
  };

  const handleEqual = () => {
    const fullSequence = historySequence + '=';

    // Check for Master PIN to unlock tactical interface
    if (fullSequence.includes(MASTER_PIN + '=') || display === MASTER_PIN) {
      onUnlockMesh();
      return;
    }

    // Check for Duress PIN to wipe data and lock down
    if (fullSequence.includes(DURESS_PIN + '=') || display === DURESS_PIN) {
      if (onDuressWipe) onDuressWipe();
      setDisplay('Error: 0');
      setWipeNotice(true);
      setTimeout(() => setWipeNotice(false), 4000);
      return;
    }

    if (operation && prevValue !== null) {
      const current = parseFloat(display);
      let res = 0;
      switch (operation) {
        case '+': res = prevValue + current; break;
        case '-': res = prevValue - current; break;
        case '×': res = prevValue * current; break;
        case '÷': res = current !== 0 ? prevValue / current : 'Error'; break;
        default: res = current;
      }
      setDisplay(String(res).slice(0, 10));
      setPrevValue(null);
      setOperation(null);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setHistorySequence('');
  };

  return (
    <div className="decoy-container">
      <div className="decoy-header-bar">
        <div className="decoy-status-pill">
          <Lock size={12} />
          <span>CALCULATOR (DISGUISE MODE)</span>
        </div>
        <button 
          className="decoy-emergency-unlock-hint"
          onClick={() => onUnlockMesh()}
          title="Return to Haven app"
        >
          <KeyRound size={13} />
          <span>Return to App</span>
        </button>
      </div>

      <div className="calculator-wrapper">
        <div className="calculator-display">
          <div className="calc-history">
            {prevValue !== null ? `${prevValue} ${operation || ''}` : ''}
          </div>
          <div className="calc-main-num">{display}</div>
        </div>

        {wipeNotice && (
          <div className="duress-wipe-banner">
            <ShieldAlert size={14} />
            <span>ALL MESSAGES & DATA ERASED SAFELY</span>
          </div>
        )}

        <div className="calc-keypad">
          <button className="calc-btn fn" onClick={handleClear}>AC</button>
          <button className="calc-btn fn" onClick={() => setDisplay(String(-parseFloat(display)))}>±</button>
          <button className="calc-btn fn" onClick={() => setDisplay(String(parseFloat(display) / 100))}>%</button>
          <button className="calc-btn op" onClick={() => handleOp('÷')}>÷</button>

          <button className="calc-btn num" onClick={() => handleDigit('7')}>7</button>
          <button className="calc-btn num" onClick={() => handleDigit('8')}>8</button>
          <button className="calc-btn num" onClick={() => handleDigit('9')}>9</button>
          <button className="calc-btn op" onClick={() => handleOp('×')}>×</button>

          <button className="calc-btn num" onClick={() => handleDigit('4')}>4</button>
          <button className="calc-btn num" onClick={() => handleDigit('5')}>5</button>
          <button className="calc-btn num" onClick={() => handleDigit('6')}>6</button>
          <button className="calc-btn op" onClick={() => handleOp('-')}>−</button>

          <button className="calc-btn num" onClick={() => handleDigit('1')}>1</button>
          <button className="calc-btn num" onClick={() => handleDigit('2')}>2</button>
          <button className="calc-btn num" onClick={() => handleDigit('3')}>3</button>
          <button className="calc-btn op" onClick={() => handleOp('+')}>+</button>

          <button className="calc-btn num zero" onClick={() => handleDigit('0')}>0</button>
          <button className="calc-btn num" onClick={() => handleDigit('.')}>.</button>
          <button className="calc-btn op eq" onClick={handleEqual}>=</button>
        </div>

        <div className="decoy-security-info">
          <div className="sec-item">
            <span className="sec-label">Tap "Return to App" above or type your code and press =</span>
          </div>
        </div>
      </div>
    </div>
  );
}
