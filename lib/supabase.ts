import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Item {
  id: number
  nome: string
  valor: number
  comprado: boolean
  nome_comprador: string | null
  tipo_pagamento: 'fisico' | 'pix' | null
  created_at: string
  updated_at: string
}

