-- Seed File for CRM SaaS 2.0
-- 1. Categorias
INSERT INTO categorias (nome, slug) VALUES ('Brasil', 'brasil'), ('Europa', 'europa'), ('Seleções', 'selecoes');

-- 2. Ligas
INSERT INTO ligas (nome, categoria_id) VALUES ('Série A', 1), ('La Liga', 2), ('Premier League', 2);

-- 3. Times
INSERT INTO times (nome, slug, liga_id) VALUES ('Flamengo', 'flamengo', 1), ('Real Madrid', 'real-madrid', 2), ('Manchester City', 'manchester-city', 3);

-- 4. Produtos
INSERT INTO produtos (nome, slug, time_id, foto_principal, preco_custo) VALUES 
('Camisa Flamengo 24/25 Home', 'flamengo-home-24-25', 1, 'https://images.yupoo.com/example/flamengo_front.jpg', 75.00),
('Camisa Real Madrid 24/25 Home', 'real-madrid-home-24-25', 2, 'https://images.yupoo.com/example/real_front.jpg', 75.00),
('Camisa Brasil 2026 Home', 'brasil-home-2026', 1, 'https://images.yupoo.com/example/brasil_front.jpg', 75.00);

-- 5. Empresa Exemplo (Senha: admin123 hash bcrypt)
INSERT INTO empresas (nome, slug, email, senha_hash) VALUES 
('Tailandesa 1.1', 'tailandesa', 'admin@teste.com', '$2b$10$w6D8Z9sW8q/mFfGvV6m2ueG5fGvV6m2ueG5fGvV6m2ueG5fGvV6m'); 

-- 6. Preços Empresa
INSERT INTO precos_empresas (empresa_id, produto_id, preco_venda, margem) VALUES 
(1, 1, 169.90, 126.50),
(1, 2, 189.90, 153.20);
