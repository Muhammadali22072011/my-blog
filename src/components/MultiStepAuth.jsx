import { useState, useEffect } from 'react'
import SecureClockAuth from './SecureClockAuth'
import { logSecurityEvent } from '../utils/securityLogger'

function MultiStepAuth({ onSuccess }) {
  const [step, setStep] = useState(1)
  const [mathAnswer, setMathAnswer] = useState('')
  const [secretAnswer, setSecretAnswer] = useState('')
  const [pattern, setPattern] = useState([])
  const [attempts, setAttempts] = useState(0)
  const [sequence, setSequence] = useState([])
  const [stepStartTime, setStepStartTime] = useState(Date.now())
  const [mouseMovements, setMouseMovements] = useState(0)
  const [honeypot, setHoneypot] = useState('')
  
  // Отслеживание движения мыши (защита от ботов)
  useEffect(() => {
    const handleMouseMove = () => {
      setMouseMovements(prev => prev + 1)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Сброс таймера при смене этапа
  useEffect(() => {
    setStepStartTime(Date.now())
    setMouseMovements(0)
  }, [step])

  const [mathProblem] = useState(() => {
    const operations = [
      { a: Math.floor(Math.random() * 20) + 10, b: Math.floor(Math.random() * 20) + 10, op: '+' },
      { a: Math.floor(Math.random() * 50) + 20, b: Math.floor(Math.random() * 20) + 5, op: '-' },
      { a: Math.floor(Math.random() * 12) + 2, b: Math.floor(Math.random() * 12) + 2, op: '*' },
    ]
    return operations[Math.floor(Math.random() * operations.length)]
  })

  const getMathResult = () => {
    switch (mathProblem.op) {
      case '+': return mathProblem.a + mathProblem.b
      case '-': return mathProblem.a - mathProblem.b
      case '*': return mathProblem.a * mathProblem.b
      default: return 0
    }
  }

  const secretQuestions = [
    { q: "?", a: "m" },
    { q: "5", a: "5" },
    { q: "2025", a: "2025" },
    { q: "2", a: "2" },
  ]
  const [secretQuestion] = useState(() => secretQuestions[Math.floor(Math.random() * secretQuestions.length)])

  const correctPattern = [1, 2, 5, 8, 9]
  const correctSequence = [1, 1, 2, 3, 5, 8]

  // Проверка временных ограничений (упрощенная)
  const validateTiming = () => {
    const elapsed = Date.now() - stepStartTime
    
    // Слишком медленно (больше 10 минут)
    if (elapsed > 600000) {
      logSecurityEvent('auth_timeout', { elapsed })
      return false
    }
    
    return true
  }

  const handleClockSuccess = () => {
    logSecurityEvent('multi_auth_step1_passed')
    setStep(2)
  }

  const handleMathSubmit = (e) => {
    e.preventDefault()
    
    // Honeypot проверка
    if (honeypot) {
      logSecurityEvent('honeypot_triggered')
      setStep(1)
      setAttempts(0)
      return
    }
    
    if (!validateTiming()) {
      setStep(1)
      setAttempts(0)
      return
    }
    
    const correct = parseInt(mathAnswer) === getMathResult()
    
    if (correct) {
      logSecurityEvent('multi_auth_step2_passed')
      setStep(3)
      setMathAnswer('')
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      logSecurityEvent('multi_auth_step2_failed', { attempts: newAttempts })
      
      if (newAttempts >= 3) {
        setStep(1)
        setAttempts(0)
      }
      setMathAnswer('')
    }
  }

  const handleSecretSubmit = (e) => {
    e.preventDefault()
    
    if (honeypot || !validateTiming()) {
      setStep(1)
      setAttempts(0)
      return
    }
    
    const correct = secretAnswer.toLowerCase().trim() === secretQuestion.a.toLowerCase()
    
    if (correct) {
      logSecurityEvent('multi_auth_step3_passed')
      setStep(4)
      setSecretAnswer('')
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      logSecurityEvent('multi_auth_step3_failed', { attempts: newAttempts })
      
      if (newAttempts >= 3) {
        setStep(1)
        setAttempts(0)
      }
      setSecretAnswer('')
    }
  }

  const handlePatternClick = (index) => {
    if (pattern.includes(index)) {
      setPattern(pattern.filter(i => i !== index))
    } else {
      setPattern([...pattern, index])
    }
  }

  const handlePatternSubmit = () => {
    if (!validateTiming()) {
      setStep(1)
      setAttempts(0)
      return
    }
    
    const correct = JSON.stringify(pattern.sort()) === JSON.stringify(correctPattern.sort())
    
    if (correct) {
      logSecurityEvent('multi_auth_step4_passed')
      setStep(5)
      setPattern([])
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      logSecurityEvent('multi_auth_step4_failed', { attempts: newAttempts })
      
      if (newAttempts >= 3) {
        setStep(1)
        setAttempts(0)
      }
      setPattern([])
    }
  }

  const handleSequenceClick = (num) => {
    setSequence([...sequence, num])
  }

  const handleSequenceSubmit = () => {
    if (!validateTiming()) {
      setStep(1)
      setAttempts(0)
      return
    }
    
    const correct = JSON.stringify(sequence) === JSON.stringify(correctSequence)
    
    if (correct) {
      logSecurityEvent('multi_auth_all_passed')
      localStorage.setItem('multi_auth_token', JSON.stringify({
        timestamp: Date.now(),
        expires: Date.now() + (60 * 60 * 1000)
      }))
      onSuccess()
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      logSecurityEvent('multi_auth_step5_failed', { attempts: newAttempts })
      
      if (newAttempts >= 3) {
        setStep(1)
        setAttempts(0)
      }
      setSequence([])
    }
  }

  if (step === 1) {
    return <SecureClockAuth onSuccess={handleClockSuccess} />
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <form onSubmit={handleMathSubmit} className="space-y-6">
              {/* Honeypot - скрытое поле */}
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ position: 'absolute', left: '-9999px' }}
                tabIndex={-1}
                autoComplete="off"
              />
              
              <div className="text-center">
                <div className="text-5xl font-light text-slate-300 mb-6 tracking-wide">
                  {mathProblem.a} {mathProblem.op} {mathProblem.b}
                </div>
                <input
                  type="number"
                  value={mathAnswer}
                  onChange={(e) => setMathAnswer(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-2xl font-light placeholder-slate-500 focus:outline-none focus:border-white/20"
                  placeholder="="
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="w-full py-3 bg-white/10 text-white font-light rounded-2xl hover:bg-white/20 transition-all">
                →
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <form onSubmit={handleSecretSubmit} className="space-y-6">
              <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} style={{ position: 'absolute', left: '-9999px' }} tabIndex={-1} autoComplete="off" />
              <div className="text-center">
                <div className="text-6xl font-light text-slate-300 mb-8">{secretQuestion.q}</div>
                <input type="text" value={secretAnswer} onChange={(e) => setSecretAnswer(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-xl font-light placeholder-slate-500 focus:outline-none focus:border-white/20" placeholder="..." required autoFocus />
              </div>
              <button type="submit" className="w-full py-3 bg-white/10 text-white font-light rounded-2xl hover:bg-white/20 transition-all">→</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} onClick={() => handlePatternClick(num)} className={`aspect-square rounded-xl text-xl font-light transition-all ${pattern.includes(num) ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>{num}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPattern([])} className="flex-1 py-3 bg-white/5 text-white font-light rounded-xl hover:bg-white/10 transition-all">↺</button>
              <button onClick={handlePatternSubmit} disabled={pattern.length === 0} className="flex-1 py-3 bg-white/10 text-white font-light rounded-xl hover:bg-white/20 transition-all disabled:opacity-30">→</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <div className="mb-6 min-h-[60px] flex items-center justify-center gap-2">
              {sequence.map((num, i) => (
                <span key={i} className="text-2xl font-light text-white">{num}{i < sequence.length - 1 && <span className="text-slate-500 mx-1">,</span>}</span>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {[1, 2, 3, 5, 8, 13, 21, 34].map((num) => (
                <button key={num} onClick={() => handleSequenceClick(num)} className="aspect-square rounded-xl bg-white/5 text-white font-light hover:bg-white/10 transition-all">{num}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSequence([])} className="flex-1 py-3 bg-white/5 text-white font-light rounded-xl hover:bg-white/10 transition-all">↺</button>
              <button onClick={handleSequenceSubmit} disabled={sequence.length === 0} className="flex-1 py-3 bg-white/10 text-white font-light rounded-xl hover:bg-white/20 transition-all disabled:opacity-30">✓</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default MultiStepAuth
