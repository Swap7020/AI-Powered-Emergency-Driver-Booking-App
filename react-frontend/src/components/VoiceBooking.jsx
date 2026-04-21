/**
 * Voice Booking — uses Web Speech API (Chrome/Edge)
 * Parses natural language like:
 *   "Book a driver from MG Road for 2 hours"
 *   "Emergency driver at Koramangala"
 *   "I need a driver for 3 hours"
 */
import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2, X, CheckCircle, AlertTriangle } from 'lucide-react'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

const HINTS = [
  '"Book a driver from MG Road for 2 hours"',
  '"Emergency driver at Koramangala"',
  '"I need a driver for 3 hours"',
  '"Book driver, pickup Indiranagar, 1 hour"',
]

function parseVoiceInput(text) {
  const t = text.toLowerCase()
  const result = { pickup_addr: '', estimated_hours: 1, emergency: false, raw: text }

  // Emergency detection
  if (/emergency|urgent|help|sos|immediately|asap/.test(t)) result.emergency = true

  // Hours extraction
  const hoursMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|hrs|hours)/)
  if (hoursMatch) result.estimated_hours = parseFloat(hoursMatch[1])

  // Location extraction — "from X", "at X", "pickup X"
  const locPatterns = [
    /(?:from|at|pickup|pick up|pick me up at|pick me up from)\s+([a-z0-9\s,]+?)(?:\s+for|\s+\d|\s*$)/i,
    /(?:driver|cab|ride)\s+(?:at|from|to)\s+([a-z0-9\s,]+?)(?:\s+for|\s+\d|\s*$)/i,
  ]
  for (const pat of locPatterns) {
    const m = text.match(pat)
    if (m) { result.pickup_addr = m[1].trim(); break }
  }

  return result
}

export default function VoiceBooking({ onResult, onClose }) {
  const [state,      setState]      = useState('idle') // idle | listening | processing | done | error | unsupported
  const [transcript, setTranscript] = useState('')
  const [interim,    setInterim]    = useState('')
  const [parsed,     setParsed]     = useState(null)
  const [hintIdx,    setHintIdx]    = useState(0)
  const recogRef = useRef(null)

  const speak = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.05; u.pitch = 1
    window.speechSynthesis.speak(u)
  }

  const startListening = useCallback(() => {
    if (!SpeechRecognition) { setState('unsupported'); return }

    const recog = new SpeechRecognition()
    recog.continuous = false
    recog.interimResults = true
    recog.lang = 'en-IN'
    recogRef.current = recog

    recog.onstart  = () => { setState('listening'); speak('Listening. Say your booking request.') }
    recog.onresult = (e) => {
      let fin = '', int = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        e.results[i].isFinal ? fin += t : int += t
      }
      if (fin) setTranscript(fin)
      setInterim(int)
    }
    recog.onend = () => {
      setInterim('')
      setState('processing')
    }
    recog.onerror = (e) => {
      setState(e.error === 'not-allowed' ? 'error' : 'idle')
    }
    recog.start()
  }, [])

  // Process transcript after listening ends
  const processTranscript = useCallback((text) => {
    if (!text.trim()) { setState('idle'); return }
    const result = parseVoiceInput(text)
    setParsed(result)
    setState('done')
    speak(result.emergency
      ? `Emergency booking detected. Pickup from ${result.pickup_addr || 'your location'}.`
      : `Got it. Booking for ${result.estimated_hours} hour${result.estimated_hours > 1 ? 's' : ''} from ${result.pickup_addr || 'your location'}.`
    )
  }, [])

  // Auto-process when state changes to processing
  if (state === 'processing' && transcript) {
    processTranscript(transcript)
  }

  const confirm = () => {
    if (parsed) onResult(parsed)
    onClose()
  }

  const retry = () => {
    setTranscript(''); setInterim(''); setParsed(null); setState('idle')
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-bounce-in">
        {/* Header */}
        <div className={`px-6 py-4 rounded-t-2xl flex items-center justify-between ${
          parsed?.emergency ? 'bg-red-600' : 'bg-brand-600'
        }`}>
          <div className="flex items-center gap-2 text-white">
            <Volume2 size={18} />
            <span className="font-bold">Voice Booking</span>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Idle */}
          {state === 'idle' && (
            <div className="text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Tap the mic and say your booking request
              </p>
              <button onClick={startListening}
                className="w-24 h-24 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center mx-auto shadow-lg hover:shadow-xl transition-all active:scale-95">
                <Mic size={36} />
              </button>
              <div className="mt-6">
                <p className="text-xs text-slate-400 mb-2">Try saying:</p>
                <p className="text-sm text-brand-600 dark:text-brand-400 italic font-medium">
                  {HINTS[hintIdx % HINTS.length]}
                </p>
                <button onClick={() => setHintIdx(i => i + 1)}
                  className="text-xs text-slate-400 hover:text-slate-600 mt-2 underline">
                  Next example
                </button>
              </div>
            </div>
          )}

          {/* Listening */}
          {state === 'listening' && (
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                <span className="absolute inset-2 rounded-full bg-red-300 animate-ping opacity-20" style={{ animationDelay: '0.3s' }} />
                <button onClick={() => recogRef.current?.stop()}
                  className="relative w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg">
                  <MicOff size={32} />
                </button>
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Listening...</p>
              {(transcript || interim) && (
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-3 text-left mt-3">
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    {transcript}
                    <span className="text-slate-400 italic">{interim}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Processing */}
          {state === 'processing' && (
            <div className="text-center py-6">
              <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300">Analyzing your request...</p>
            </div>
          )}

          {/* Done — show parsed result */}
          {state === 'done' && parsed && (
            <div>
              <div className={`rounded-xl p-4 mb-4 ${
                parsed.emergency
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800'
              }`}>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">You said:</p>
                <p className="text-sm italic text-slate-600 dark:text-slate-300 mb-3">"{parsed.raw}"</p>
                <div className="space-y-2">
                  {parsed.emergency && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-sm">
                      <AlertTriangle size={15} /> Emergency Booking
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">📍 Pickup:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {parsed.pickup_addr || 'Current location'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">⏱️ Duration:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {parsed.estimated_hours} hour{parsed.estimated_hours > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={retry}
                  className="flex-1 btn-ghost border border-slate-200 dark:border-slate-600 text-sm">
                  <MicOff size={14} /> Try Again
                </button>
                <button onClick={confirm}
                  className={`flex-1 text-sm ${parsed.emergency ? 'btn-emergency' : 'btn-primary'}`}>
                  <CheckCircle size={14} />
                  {parsed.emergency ? '🚨 Book Emergency' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}

          {/* Unsupported */}
          {state === 'unsupported' && (
            <div className="text-center py-4">
              <p className="text-red-500 font-medium mb-2">Voice not supported</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Please use Chrome or Edge browser for voice booking.
              </p>
              <button onClick={onClose} className="btn-primary mt-4 text-sm">Close</button>
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className="text-center py-4">
              <p className="text-red-500 font-medium mb-2">Microphone access denied</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Please allow microphone access in your browser settings.
              </p>
              <button onClick={onClose} className="btn-primary mt-4 text-sm">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
