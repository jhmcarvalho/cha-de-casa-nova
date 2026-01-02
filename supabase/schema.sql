-- Tabela de itens para o chá de casa nova
CREATE TABLE IF NOT EXISTS itens (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  comprado BOOLEAN DEFAULT FALSE,
  nome_comprador TEXT,
  tipo_pagamento TEXT CHECK (tipo_pagamento IN ('fisico', 'pix')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índice para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_itens_comprado ON itens(comprado);
CREATE INDEX IF NOT EXISTS idx_itens_nome ON itens(nome);

-- Habilitar RLS (Row Level Security)
ALTER TABLE itens ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (qualquer um pode ver os itens)
CREATE POLICY "Permitir leitura pública de itens"
  ON itens FOR SELECT
  USING (true);

-- Política para permitir atualização pública (qualquer um pode marcar como comprado)
CREATE POLICY "Permitir atualização pública de itens"
  ON itens FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_itens_updated_at BEFORE UPDATE ON itens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Exemplo de inserção de alguns itens (você pode modificar/remover conforme necessário)
-- Descomente e ajuste os valores conforme sua necessidade:

/*
INSERT INTO itens (nome, valor) VALUES
  ('Jogo de panelas', 350.00),
  ('Conjunto de talheres', 150.00),
  ('Jogo de pratos', 200.00),
  ('Panela de pressão', 180.00),
  ('Batedeira', 450.00),
  ('Liquidificador', 250.00),
  ('Micro-ondas', 600.00),
  ('Geladeira', 2500.00),
  ('Fogão', 1200.00),
  ('Aspirador de pó', 400.00);
*/

