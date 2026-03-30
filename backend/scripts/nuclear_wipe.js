const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function nuclearWipe() {
  try {
    console.log('--- INICIANDO RESET NUCLEAR DO CATÁLOGO ---');

    // 1. Deletar Arquivos Físicos
    const catalogPath = 'd:/saas-crm/catalogo_final_completo';
    if (fs.existsSync(catalogPath)) {
        console.log('Deletando pasta do catálogo físico...');
        fs.rmSync(catalogPath, { recursive: true, force: true });
        console.log('Pasta deletada.');
    }

    // 2. Limpar Banco de Dados (SQL Bruto para CASCADE)
    console.log('Limpando tabelas do banco de dados (SQL Bruto)...');
    
    await prisma.$executeRawUnsafe('TRUNCATE TABLE precos_empresas, produtos, times, ligas, categorias RESTART IDENTITY CASCADE;');
    
    console.log('\n✅ RESET NUCLEAR CONCLUÍDO COM SUCESSO. Sistema pronto para novo sync.');

  } catch (err) {
    console.error('ERRO NO RESET:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

nuclearWipe();
