# PROMPT PARA USAR NO LOVABLE

Copie e cole o texto abaixo no chat do Lovable para corrigir a exibição das fotos:

---

**PROMPT:**

"Ajuste os componentes de produto (Admin e Vitrine) para exibir corretamente as fotos de acordo com a estrutura do banco de dados `master_products`.

Certifique-se de que:
1. No componente de Admin (`PedidosCRM.tsx` e outros), o sistema puxe e exiba o campo `foto_frente`.
2. Na vitrine da loja (`Loja.tsx`), o componente use o campo `foto_frente` como imagem principal e o campo `foto_verso` para o efeito de 'hover flip' (trocar a imagem ao passar o mouse).
3. Se o campo `foto_frente` estiver vazio, use `imagem_url` como fallback.
4. O mapeamento correto no Supabase é: 
   - `foto_frente`: URL da foto de frente (vinda do scraper).
   - `foto_verso`: URL da foto de costas (vinda do scraper).
   - `imagens`: Array com todas as fotos.

Atualmente, alguns componentes estão puxando apenas `foto_frente` ou `imagem_url`, por isso as fotos não estão aparecendo em todos os lugares. Sincronize todos os hooks e selects do Supabase para incluir esses campos."

---
