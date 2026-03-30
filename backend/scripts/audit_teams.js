const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
    console.log('--- AUDITORIA DE TIMES ---');
    const teams = await prisma.time.findMany({
        include: {
            _count: { select: { produtos: true } },
            liga: { select: { nome: true } }
        }
    });

    const dirtyTeams = teams.filter(t => 
        t._count.produtos > 0 && 
        (/\d{2}[-\/]\d{2}/.test(t.nome) || 
         t.nome.includes('JERSEY') || 
         t.nome.includes('SHIRT') ||
         t.nome.includes('REVERSIBLE') ||
         t.nome.includes('WINDBREAKER') ||
         t.nome.includes('RETRO'))
    );

    console.log(`Encontrados ${dirtyTeams.length} times com nomes sujos.`);
    dirtyTeams.forEach(t => {
        console.log(`${t.id} | ${t.nome} | ${t.liga.nome} | ${t._count.produtos} produtos`);
    });

    // Agrupar por base (Primeira palavra + Normalização)
    const groups = {};
    teams.forEach(t => {
        if (t._count.produtos === 0) return;
        const base = t.nome.split(' ')[0].toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        if (!groups[base]) groups[base] = [];
        groups[base].push({ id: t.id, nome: t.nome, count: t._count.produtos });
    });

    console.log('\n--- POSSÍVEIS DUPLICADOS (MESMA BASE) ---');
    for (const base in groups) {
        if (groups[base].length > 1) {
            console.log(`\n[${base}]:`);
            groups[base].forEach(g => console.log(`  - ${g.id}: ${g.nome} (${g.count} prods)`));
        }
    }

    process.exit(0);
}

audit().catch(e => { console.error(e); process.exit(1); });
