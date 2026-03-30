import os
import json
import asyncio
from prisma import Prisma
from pathlib import Path

# Configurações do Catálogo
CATALOG_PATH = Path("d:/crm-camisas-tailandesas/img/catalog.json")

async def main():
    if not CATALOG_PATH.exists():
        print(f"❌ Erro: Arquivo {CATALOG_PATH} não encontrado. Aguarde o Scraper finalizar.")
        return

    prisma = Prisma()
    await prisma.connect()

    print("🚀 Iniciando Importação para o SaaS CRM 2.0...")

    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
        items = data.get("items", [])

    imported_count = 0
    for item in items:
        # 1. Garantir Categoria
        cat_name = item.get("category", "OUTROS").capitalize()
        cat = await prisma.categoria.upsert(
            where={"nome": cat_name},
            data={
                "create": {"nome": cat_name, "slug": cat_name.lower()},
                "update": {}
            }
        )

        # 2. Garantir Liga
        league_name = item.get("league", "GERAL")
        league = await prisma.liga.upsert(
            where={"nome_categoria_id": {"nome": league_name, "categoria_id": cat.id}},
            data={
                "create": {"nome": league_name, "categoria_id": cat.id},
                "update": {}
            }
        )

        # 3. Garantir Time
        team_name = item.get("team", "UNKNOWN")
        team = await prisma.time.upsert(
            where={"slug": item.get("team_slug", team_name.lower())},
            data={
                "create": {
                    "nome": team_name,
                    "slug": item.get("team_slug", team_name.lower()),
                    "liga_id": league.id
                },
                "update": {}
            }
        )

        # 4. Criar Produto
        # Nota: Só criamos se for a foto FRONT para ser a principal
        if item.get("view") == "FRONT":
            await prisma.produto.upsert(
                where={"slug": item.get("slug")},
                data={
                    "create": {
                        "nome": item.get("name"),
                        "slug": item.get("slug"),
                        "time_id": team.id,
                        "foto_principal": item.get("source_url"),
                        "preco_custo": 75.00 # Padrão
                    },
                    "update": {
                        "foto_principal": item.get("source_url")
                    }
                }
            )
            imported_count += 1

    print(f"✅ Importação finalizada! {imported_count} produtos adicionados/atualizados.")
    await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
