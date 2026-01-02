'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, Item } from '@/lib/supabase'

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [nomeComprador, setNomeComprador] = useState('')
  const [tipoPagamento, setTipoPagamento] = useState<'fisico' | 'pix'>('fisico')
  const [showModal, setShowModal] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetchItems()
    
    // Inicializar áudio
    if (typeof window !== 'undefined') {
      const audio = new Audio('/hedwigs-theme.mp3')
      audio.loop = true
      audio.volume = 0.5
      audioRef.current = audio
      
      // Tentar tocar automaticamente (pode ser bloqueado pelo navegador)
      const playPromise = audio.play()
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
          })
          .catch(() => {
            // Autoplay foi bloqueado - usuário precisará clicar para tocar
            setIsPlaying(false)
          })
      }
      
      return () => {
        audio.pause()
        audio.src = ''
      }
    }
  }, [])

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true)
        }).catch(() => {
          setIsPlaying(false)
        })
      }
    }
  }

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('itens')
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Erro ao buscar itens:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectItem = (item: Item) => {
    if (item.comprado) return
    setSelectedItem(item)
    setNomeComprador('')
    setTipoPagamento('fisico')
    setShowModal(true)
  }

  const handleConfirmPurchase = async () => {
    if (!selectedItem || !nomeComprador.trim()) {
      alert('Por favor, informe o seu nome')
      return
    }

    try {
      const { error } = await supabase
        .from('itens')
        .update({
          comprado: true,
          nome_comprador: nomeComprador.trim(),
          tipo_pagamento: tipoPagamento,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedItem.id)

      if (error) throw error

      await fetchItems()
      setShowModal(false)
      setSelectedItem(null)
      setNomeComprador('')
    } catch (error) {
      console.error('Erro ao atualizar item:', error)
      alert('Erro ao processar a compra. Tente novamente.')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const chavePix = process.env.NEXT_PUBLIC_CHAVE_PIX || ''

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Chave PIX copiada para a área de transferência!')
    } catch (err) {
      console.error('Erro ao copiar:', err)
      alert('Erro ao copiar. Por favor, copie manualmente.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    )
  }

  const backgroundImageUrl = 'https://images.unsplash.com/photo-1656878564120-ab988c47f0b5?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Overlay escuro para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/85 via-slate-800/80 to-slate-900/85"></div>
      
      {/* Controle de áudio */}
      <button
        onClick={toggleAudio}
        className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur-sm border-2 border-amber-400/50 hover:border-amber-300 flex items-center justify-center transition-all shadow-lg hover:scale-110"
        aria-label={isPlaying ? 'Pausar música' : 'Tocar música'}
        title={isPlaying ? 'Pausar música' : 'Tocar música'}
      >
        {isPlaying ? (
          <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="text-6xl mb-2">✨</div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">
            Chá de Casa Nova
          </h1>
          <p className="text-amber-400 text-2xl font-bold mb-2 tracking-wide">
            Jeferson
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-yellow-300 mx-auto mb-4"></div>
          <p className="text-slate-200 text-lg font-medium">
            Escolha um item da lista para presentear
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelectItem(item)}
              className={`
                group relative
                bg-white/95 backdrop-blur-md
                rounded-xl
                border-l-4
                transition-all duration-300 ease-out
                ${item.comprado
                  ? 'border-green-500 opacity-75 cursor-not-allowed'
                  : 'border-amber-400 hover:border-amber-300 hover:shadow-2xl hover:shadow-amber-500/20 cursor-pointer hover:-translate-y-1 hover:bg-white'
                }
                shadow-lg
              `}
            >
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`
                      text-xl font-bold
                      ${item.comprado ? 'text-slate-500 line-through' : 'text-slate-900'}
                      group-hover:text-amber-600 transition-colors
                    `}>
                      {item.nome}
                    </h3>
                    {item.comprado && (
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                  
                  {item.comprado ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                      <span className="font-medium">Comprado por {item.nome_comprador}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs">
                        {item.tipo_pagamento === 'pix' ? '💰 PIX' : '📦 Item físico'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 font-medium">
                      {formatCurrency(item.valor)}
                    </div>
                  )}
                </div>

                {!item.comprado && (
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-all">
                      →
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-amber-200">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">✨</div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Confirmar Compra
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-yellow-300 mx-auto"></div>
              </div>
              
              <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200">
                <p className="text-2xl font-bold text-slate-900 mb-2">
                  {selectedItem.nome}
                </p>
                <p className="text-lg text-slate-600 font-medium">
                  {formatCurrency(selectedItem.valor)}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-slate-700 font-semibold mb-3">
                  Seu nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nomeComprador}
                  onChange={(e) => setNomeComprador(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-800 font-medium"
                  placeholder="Digite seu nome completo"
                />
              </div>

              <div className="mb-6">
                <label className="block text-slate-700 font-semibold mb-3">
                  Como deseja presentear?
                </label>
                <div className="space-y-3">
                  <label className={`
                    flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all
                    ${tipoPagamento === 'fisico' 
                      ? 'border-blue-600 bg-blue-50 shadow-sm' 
                      : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                    }
                  `}>
                    <input
                      type="radio"
                      value="fisico"
                      checked={tipoPagamento === 'fisico'}
                      onChange={(e) => setTipoPagamento(e.target.value as 'fisico')}
                      className="mr-4 w-5 h-5 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 font-medium">📦 Comprar o item físico</span>
                  </label>
                  <label className={`
                    flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all
                    ${tipoPagamento === 'pix' 
                      ? 'border-blue-600 bg-blue-50 shadow-sm' 
                      : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                    }
                  `}>
                    <input
                      type="radio"
                      value="pix"
                      checked={tipoPagamento === 'pix'}
                      onChange={(e) => setTipoPagamento(e.target.value as 'pix')}
                      className="mr-4 w-5 h-5 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 font-medium">
                      💰 Fazer PIX de {formatCurrency(selectedItem.valor)}
                    </span>
                  </label>
                </div>
              </div>

              {tipoPagamento === 'pix' && (
                <div className="mb-6 p-5 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <p className="text-sm text-slate-700 font-bold mb-3 flex items-center gap-2">
                    <span className="text-lg">💰</span> Chave PIX
                  </p>
                  {chavePix ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-3 bg-white border-2 border-blue-300 rounded-xl text-sm text-slate-800 break-all font-mono shadow-sm">
                          {chavePix}
                        </code>
                        <button
                          onClick={() => copyToClipboard(chavePix)}
                          className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-semibold whitespace-nowrap"
                        >
                          Copiar
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        💡 Valor a transferir: <span className="font-bold">{formatCurrency(selectedItem.valor)}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">
                      Configure a variável NEXT_PUBLIC_CHAVE_PIX para exibir a chave PIX aqui.
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedItem(null)
                    setNomeComprador('')
                  }}
                  className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPurchase}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl font-bold"
                >
                  Confirmar ✨
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

