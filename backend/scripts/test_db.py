import asyncio
from prisma import Prisma

async def test():
    urls = [
        "postgresql://postgres:Mh4M9k%21HPVq%2ED2cNG%24W%3Fn4%3EF1%2E%3FQ@poker.c548oskckol3.sa-east-1.rds.amazonaws.com:5432/postgres?sslmode=require",
        "postgresql://postgres:Wzwz%402025Ciberntico@44.192.122.113:5432/postgres?sslmode=require",
        "postgresql://postgres:admin123@poker.c548oskckol3.sa-east-1.rds.amazonaws.com:5432/postgres?sslmode=require"
    ]
    
    for url in urls:
        print(f"Testing {url.split('@')[1]}...")
        p = Prisma(datasource={"url": url})
        try:
            await p.connect()
            print(f"✅ SUCCESS with {url.split('@')[1]}")
            await p.disconnect()
            break
        except Exception as e:
            print(f"❌ FAILED: {str(e)[:100]}")

if __name__ == "__main__":
    asyncio.run(test())
