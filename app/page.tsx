'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, Item } from '@/lib/supabase'

type ToastType = 'success' | 'error'
type View = 'home' | 'lista' | 'pix'

interface Toast {
  id: string
  message: string
  type: ToastType
}

export default function Home() {
  const [view, setView] = useState<View>('home')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [nomeComprador, setNomeComprador] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [nomeDoador, setNomeDoador] = useState('')
  const [valorPix, setValorPix] = useState('')
  const [chavePixSelecionada, setChavePixSelecionada] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isNavigatingRef = useRef(false)

  const chavePix = process.env.NEXT_PUBLIC_CHAVE_PIX || ''

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

  // Gerenciar history quando view muda
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false
      return
    }

    // Se mudou para uma tela secundária, adicionar estado no history
    // Isso permite que o botão voltar funcione corretamente
    if (view !== 'home') {
      window.history.pushState({ view }, '', window.location.href)
    }
  }, [view])

  // Interceptar botão voltar do navegador
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = () => {
      // Se estiver em uma tela secundária, voltar para home
      if (view !== 'home') {
        isNavigatingRef.current = true
        setView('home')
      }
      // Se estiver em home, permitir comportamento padrão (sair do site)
    }

    // Adicionar listener para o evento popstate
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [view])

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
    setShowModal(true)
  }

  const handleConfirmPurchase = async () => {
    if (!selectedItem) {
      return
    }

    try {
      const { error } = await supabase
        .from('itens')
        .update({
          comprado: true,
          nome_comprador: nomeComprador.trim() || null,
          tipo_pagamento: 'fisico',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedItem.id)

      if (error) throw error

      await fetchItems()
      setShowModal(false)
      setSelectedItem(null)
      setNomeComprador('')
      showToast('Compra confirmada com sucesso! ✨', 'success')
    } catch (error) {
      console.error('Erro ao atualizar item:', error)
      showToast('Erro ao processar a compra. Tente novamente.', 'error')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatCurrencyInput = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''
    // Converte para centavos e depois para reais
    const cents = parseInt(numbers, 10)
    return (cents / 100).toFixed(2)
  }

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { id, message, type }
    setToasts((prev) => [...prev, newToast])

    // Remove o toast automaticamente após 4 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 4000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('Chave PIX copiada para a área de transferência!', 'success')
    } catch (err) {
      console.error('Erro ao copiar:', err)
      showToast('Erro ao copiar. Por favor, copie manualmente.', 'error')
    }
  }

  const handleValorPixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    // Remove formatação existente (R$, pontos, vírgulas, espaços)
    value = value.replace(/[^\d]/g, '')
    if (!value) {
      setValorPix('')
      return
    }
    // Converte para formato decimal (centavos / 100)
    const formatted = (parseInt(value, 10) / 100).toFixed(2)
    setValorPix(formatted)
  }

  const renderHome = () => (
    <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
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
          Como você gostaria de presentear?
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {/* Opção 1: Lista de Itens */}
        <button
          onClick={() => setView('lista')}
          className="group relative bg-white/95 backdrop-blur-md rounded-xl border-2 border-amber-400 hover:border-amber-300 transition-all duration-300 ease-out shadow-xl hover:shadow-amber-500/30 cursor-pointer hover:-translate-y-1 p-5 md:p-6 text-left"
        >
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl mb-3">📦</div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1.5 group-hover:text-amber-600 transition-colors">
              Lista de Itens
            </h2>
            <p className="text-sm md:text-base text-slate-600 font-medium">
              Escolha um item da lista de presentes
            </p>
            <div className="mt-3 w-10 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-300"></div>
          </div>
        </button>

        {/* Opção 2: Fazer PIX */}
        <button
          onClick={() => {
            setView('pix')
            setChavePixSelecionada(chavePix)
          }}
          className="group relative bg-white/95 backdrop-blur-md rounded-xl border-2 border-amber-400 hover:border-amber-300 transition-all duration-300 ease-out shadow-xl hover:shadow-amber-500/30 cursor-pointer hover:-translate-y-1 p-5 md:p-6 text-left"
        >
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl mb-3">💰</div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1.5 group-hover:text-amber-600 transition-colors">
              Fazer PIX
            </h2>
            <p className="text-sm md:text-base text-slate-600 font-medium">
              Envie um presente em dinheiro do valor que desejar
            </p>
            <div className="mt-3 w-10 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-300"></div>
          </div>
        </button>
      </div>
    </div>
  )

  const renderLista = () => (
    <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
      {/* Cabeçalho com botão voltar */}
      <div className="mb-8">
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-2 text-white hover:text-amber-400 transition-colors mb-4 group"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold">Voltar</span>
        </button>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            Lista de Itens
          </h1>
          <p className="text-slate-200 text-lg font-medium">
            Escolha um item para presentear
          </p>
        </div>
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
                
                {item.comprado && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <span className="font-medium">
                      Item comprado!
                    </span>
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

      {/* Modal de confirmação */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col border-2 border-amber-200">
            <div className="overflow-y-auto flex-1 p-6">
              <div className="text-center mb-4">
                <div className="text-3xl mb-1">✨</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  Confirmar Compra
                </h2>
                <div className="w-12 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-300 mx-auto"></div>
              </div>
              
              <div className="mb-4 p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                <p className="text-lg font-bold text-slate-900 mb-1">
                  {selectedItem.nome}
                </p>
                <p className="text-base text-slate-600 font-medium">
                  {/*formatCurrency(selectedItem.valor)*/}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-slate-700 font-semibold mb-2 text-sm">
                  Nome do comprador (opcional)
                </label>
                <input
                  type="text"
                  value={nomeComprador}
                  onChange={(e) => setNomeComprador(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none text-slate-800 font-medium text-sm"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-slate-200 bg-white rounded-b-2xl">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedItem(null)
                  setNomeComprador('')
                }}
                className="flex-1 px-4 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl font-bold text-sm"
              >
                Confirmar ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderPix = () => {
    const valorNumerico = parseFloat(valorPix) || 0

    return (
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Cabeçalho com botão voltar */}
        <div className="mb-8">
          <button
            onClick={() => {
              setView('home')
              setNomeDoador('')
              setValorPix('')
              setChavePixSelecionada('')
            }}
            className="flex items-center gap-2 text-white hover:text-amber-400 transition-colors mb-4 group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold">Voltar</span>
          </button>
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">💰</div>
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              Presente em PIX
            </h1>
            <p className="text-slate-200 text-lg font-medium">
              Escolha o valor que deseja presentear
            </p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-amber-200 p-6 md:p-8">
          <div className="space-y-6">
            {/* Campo Nome do Doador */}
            <div>
              <label className="block text-slate-700 font-semibold mb-2 text-sm">
                Seu nome (opcional)
              </label>
              <input
                type="text"
                value={nomeDoador}
                onChange={(e) => setNomeDoador(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none text-slate-800 font-medium"
                placeholder="Digite seu nome"
              />
            </div>

            {/* Campo Valor */}
            <div>
              <label className="block text-slate-700 font-semibold mb-2 text-sm">
                Valor do presente
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 font-bold text-lg">
                  R$
                </span>
                <input
                  type="text"
                  value={valorPix ? formatCurrency(parseFloat(valorPix)) : ''}
                  onChange={handleValorPixChange}
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none text-slate-800 font-medium text-lg"
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>
              {valorNumerico > 0 && (
                <p className="mt-2 text-sm text-slate-600 font-medium">
                  Valor: <span className="font-bold text-amber-600">{formatCurrency(valorNumerico)}</span>
                </p>
              )}
            </div>

            {/* Informações da Chave PIX */}
            {chavePix && (
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm text-slate-700 font-bold mb-3 flex items-center gap-2">
                  <span>💰</span> Chave PIX para pagamento
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white border-2 border-blue-300 rounded-lg text-sm text-slate-800 break-all font-mono shadow-sm">
                      {chavePix}
                    </code>
                    <button
                      onClick={() => copyToClipboard(chavePix)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm whitespace-nowrap"
                    >
                      Copiar
                    </button>
                  </div>
                  {valorNumerico > 0 && (
                    <div className="p-3 bg-white/80 rounded-lg border border-blue-200">
                      <p className="text-xs text-slate-600 font-medium">
                        💡 <span className="font-bold">Valor a ser transferido:</span>{' '}
                        <span className="font-bold text-blue-700">{formatCurrency(valorNumerico)}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!chavePix && (
              <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Chave PIX não configurada. Configure a variável NEXT_PUBLIC_CHAVE_PIX.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/85 via-slate-800/80 to-slate-900/85"></div>
        <div className="relative z-10 text-xl text-white">Carregando...</div>
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
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              bg-white/95 backdrop-blur-md
              rounded-xl shadow-2xl
              border-l-4
              p-4
              flex items-start justify-between gap-3
              transform transition-all duration-300 ease-out
              ${toast.type === 'success' 
                ? 'border-green-500 bg-gradient-to-r from-white/95 to-green-50/50' 
                : 'border-red-500 bg-gradient-to-r from-white/95 to-red-50/50'
              }
            `}
            style={{
              animation: `slideInRight 0.3s ease-out ${index * 0.05}s both`
            }}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {toast.type === 'success' ? (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <p className="text-sm font-semibold flex-1 text-slate-800">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-slate-200/50 flex items-center justify-center transition-colors group"
              aria-label="Fechar"
            >
              <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

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

      {/* Renderizar view atual */}
      {view === 'home' && renderHome()}
      {view === 'lista' && renderLista()}
      {view === 'pix' && renderPix()}
    </div>
  )
}
