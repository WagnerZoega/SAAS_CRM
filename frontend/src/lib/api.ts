const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE_URL = `${API_URL}/api`;

export async function fetchLoja(slug: string) {
  const res = await fetch(`${API_BASE_URL}/precos/loja/${slug}`, {
    next: { revalidate: 60 } // Cache por 1 minuto
  });
  if (!res.ok) throw new Error('Falha ao carregar loja');
  return res.json();
}

export async function criarPedido(dados: any) {
  const res = await fetch(`${API_BASE_URL}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  return res.json();
}
