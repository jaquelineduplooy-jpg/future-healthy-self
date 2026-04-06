'use client'

import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { createRecipe } from '@/lib/data'
import { normaliseUnit, parseAmount } from '@/lib/utils'

type Conf = 'high' | 'medium' | 'low'
type ParsedField = { label: string; value: string; editable: boolean; conf: Conf }
type ParsedIng   = { name: string; amount: number; unit: string; unitFlagged: boolean; confidence: Conf; originalText: string }
type Stage = 'upload' | 'processing' | 'review' | 'saving' | 'saved'

const CONF_DOT: Record<Conf, string> = { high: 'bg-mint-dark', medium: 'bg-orange', low: 'bg-berry' }

export default function OCRPage() {
  const { user } = useAuth()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [stage, setStage]     = useState<Stage>('upload')
  const [progress, setProgress] = useState(0)
  const [error, setError]     = useState<string | null>(null)
  const [fields, setFields]   = useState<ParsedField[]>([])
  const [ings, setIngs]       = useState<ParsedIng[]>([])
  const [ocrConf, setOcrConf] = useState(0)

  const processFile = useCallback(async (file: File) => {
    setStage('processing')
    setError(null)
    setProgress(20)

    const formData = new FormData()
    formData.append('image', file)

    try {
      setProgress(50)
      const res  = await fetch('/api/ocr-import', { method: 'POST', body: formData })
      setProgress(80)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Processing failed')
        setStage('upload')
        return
      }

      setOcrConf(data.ocrConfidence ?? 0.9)
      setFields([
        { label: 'Name',     value: data.name ?? '',          editable: true,  conf: data.ocrConfidence > 0.85 ? 'high' : 'medium' },
        { label: 'Category', value: data.category ?? 'Main',  editable: true,  conf: 'high' },
        { label: 'Source',   value: data.source ?? 'User upload', editable: true, conf: data.source ? 'high' : 'medium' },
        { label: 'Servings', value: String(data.servings ?? 4), editable: true, conf: 'high' },
      ])
      setIngs(data.ingredients ?? [])
      setProgress(100)
      setStage('review')
    } catch (e) {
      setError('Network error — please try again')
      setStage('upload')
    }
  }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const updateField = (i: number, val: string) =>
    setFields(prev => prev.map((f, fi) => fi === i ? { ...f, value: val } : f))

  const updateIng = (i: number, key: keyof ParsedIng, val: string | number) =>
    setIngs(prev => prev.map((ing, ii) => ii === i ? { ...ing, [key]: val } : ing))

  const removeIng = (i: number) => setIngs(prev => prev.filter((_, ii) => ii !== i))

  const addIng = () => setIngs(prev => [...prev, { name: '', amount: 1, unit: 'each', unitFlagged: false, confidence: 'high', originalText: '' }])

  const save = async () => {
    if (!user) return
    setStage('saving')
    const f = Object.fromEntries(fields.map(f => [f.label.toLowerCase(), f.value]))
    await createRecipe(
      {
        name: f.name, category: f.category as any, source: f.source,
        servings: parseInt(f.servings) || 1, user_id: user.id,
        prep_time_mins: null, cook_time_mins: null,
        screenshot_url: null, ocr_confidence: ocrConf, is_user_uploaded: true,
      },
      ings.map(i => ({ name: i.name, amount: i.amount, unit: i.unit, original_text: i.originalText, ocr_flagged: i.unitFlagged }))
    )
    setStage('saved')
  }

  if (stage === 'saved') return (
    <div className="flex flex-col h-screen bg-white items-center justify-center px-8 text-center">
      <div className="text-5xl mb-4">✅</div>
      <div className="text-xl font-semibold text-gray-900 mb-2">Recipe saved!</div>
      <div className="text-sm text-gray-400 mb-8">It's now available in your Meal Planner.</div>
      <button onClick={() => setStage('upload')} className="btn-primary max-w-xs">Add another recipe</button>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-berry px-5 pt-14 pb-3 flex justify-between items-center">
        <span className="text-white text-sm font-semibold">9:41</span>
        <span className="text-white text-xs">●●●</span>
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        {stage === 'review' || stage === 'saving'
          ? <button onClick={() => setStage('upload')} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-base">←</button>
          : <div className="w-9" />}
        <h1 className="text-lg font-semibold text-gray-900">Add recipe</h1>
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-lg">⋯</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* ── UPLOAD STAGE ── */}
        {(stage === 'upload' || stage === 'processing') && (
          <>
            <div
              className="border-2 border-dashed border-orange rounded-[16px] p-8 text-center mb-4 cursor-pointer active:bg-orange-light/50 transition-colors"
              onClick={() => stage === 'upload' && fileRef.current?.click()}>
              <div className="w-16 h-16 bg-orange-light rounded-full flex items-center justify-center mx-auto mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="6" width="20" height="15" rx="2" stroke="#b05010" strokeWidth="1.5"/>
                  <circle cx="12" cy="13" r="3.5" stroke="#b05010" strokeWidth="1.5"/>
                  <path d="M7 6l2-3h6l2 3" stroke="#b05010" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-base font-semibold text-gray-800 mb-1">Upload a recipe screenshot</div>
              <div className="text-sm text-gray-400">Photo, screenshot, or PDF · max 20MB</div>
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
              <div className="flex gap-3 justify-center mt-4">
                <button onClick={e => { e.stopPropagation(); stage === 'upload' && fileRef.current?.click() }}
                  className="px-5 py-2.5 rounded-full bg-orange text-white text-sm font-semibold border-0">
                  Choose photo
                </button>
              </div>
            </div>

            {stage === 'processing' && (
              <div className="text-center py-6">
                <div className="text-3xl mb-3">🔍</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Extracting recipe…</div>
                <div className="text-xs text-gray-400 mb-4">OCR + AI parsing in progress</div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mx-4">
                  <div className="h-full bg-orange rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700 mb-4">{error}</div>
            )}

            <div className="text-center text-xs text-gray-400">
              Or{' '}
              <button className="text-berry font-semibold underline"
                onClick={() => processFile(new File([''], 'sample.jpg', { type: 'image/jpeg' }))}>
                use sample image
              </button>
            </div>
          </>
        )}

        {/* ── REVIEW STAGE ── */}
        {(stage === 'review' || stage === 'saving') && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">Review parsed recipe</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Fields */}
            <div className="bg-gray-50 rounded-[14px] p-4 mb-3">
              {fields.map((f, i) => (
                <div key={f.label} className={`flex items-center gap-3 py-2.5 ${i < fields.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <span className="text-xs text-gray-400 w-16 flex-shrink-0">{f.label}</span>
                  {f.label === 'Category' ? (
                    <select value={f.value} onChange={e => updateField(i, e.target.value)}
                      className="flex-1 text-sm bg-transparent border-0 outline-none text-gray-800">
                      <option>Main</option><option>Side</option><option>Brunch</option>
                    </select>
                  ) : (
                    <input value={f.value} onChange={e => updateField(i, e.target.value)}
                      className="flex-1 text-sm bg-transparent border-0 outline-none text-gray-800" />
                  )}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${CONF_DOT[f.conf]}`} />
                </div>
              ))}
            </div>

            {/* Ingredients */}
            <div className="text-sm font-semibold text-gray-800 mb-2">Ingredients</div>
            <div className="bg-gray-50 rounded-[14px] px-3 py-1 mb-2">
              {ings.map((ing, i) => (
                <div key={i} className={[
                  'flex items-center gap-2 py-2 border-b border-gray-100 last:border-0',
                  ing.unitFlagged ? 'bg-gold-light/50 rounded-lg px-1 -mx-1 my-1' : '',
                ].join(' ')}>
                  <input value={ing.amount} onChange={e => updateIng(i, 'amount', parseAmount(e.target.value))}
                    className="w-10 text-sm text-center rounded-md px-1.5 py-1 bg-white border border-gray-100" />
                  <span className={`text-xs px-1.5 py-1 rounded-md border bg-white min-w-[48px] text-center ${ing.unitFlagged ? 'text-gold-dark border-yellow-200 font-semibold' : 'text-gray-400 border-gray-100'}`}>
                    {ing.unit}
                  </span>
                  <span className={`flex-1 text-sm ${ing.unitFlagged ? 'text-gold-dark' : 'text-gray-800'}`}>{ing.name}</span>
                  {ing.unitFlagged
                    ? <span className="text-[10px] text-gold-dark font-semibold">review</span>
                    : <button onClick={() => removeIng(i)} className="text-gray-300 text-lg leading-none">×</button>}
                </div>
              ))}
            </div>
            <button onClick={addIng} className="text-xs text-berry font-semibold text-center w-full py-1 mb-4">
              + Add ingredient
            </button>

            {/* Confidence guide */}
            <div className="flex gap-3 text-xs mb-4">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-mint-dark inline-block" /><span className="text-gray-400">High confidence</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange inline-block" /><span className="text-gray-400">Medium</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-berry inline-block" /><span className="text-gray-400">Low — review</span></span>
            </div>

            <button onClick={save} disabled={stage === 'saving'}
              className="btn-primary disabled:opacity-50">
              {stage === 'saving' ? 'Saving…' : 'Save to recipe database'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
