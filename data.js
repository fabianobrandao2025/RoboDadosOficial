const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

const caData = new Map();
let isDataReady = false;

function loadData() {
  console.log('[DADOS] Iniciando carregamento do arquivo caepi.csv...');
  const csvFilePath = path.resolve(__dirname, 'caepi.csv');
  
  // Usamos 'latin1' que é a codificação correta para o arquivo do governo
  const fileContent = fs.readFileSync(csvFilePath, 'latin1'); 

  const parser = parse(fileContent, {
    delimiter: ';', // O separador do arquivo do governo é ';'
    columns: true,  // Usa a primeira linha como cabeçalho
    trim: true,
    skip_empty_lines: true
  });

  parser.on('readable', function(){
    let record;
    while ((record = parser.read()) !== null) {
      // Usamos o nome da coluna exato do arquivo que você enviou: 'CA'
      const caKey = record['CA'];
      if (caKey) {
        caData.set(String(caKey).trim(), record);
      }
    }
  });

  parser.on('end', function(){
    isDataReady = true;
    console.log(`[DADOS] Base de dados carregada com sucesso. Total de ${caData.size} registros.`);
  });

  parser.on('error', function(err){
    console.error('[DADOS] ERRO AO LER O ARQUIVO CSV:', err.message);
  });
}

function getCAInfo(caNumber) {
  if (!isDataReady) {
    return { error: 'A base de dados ainda está a ser carregada. Por favor, tente novamente em um minuto.' };
  }
  
  const caInfo = caData.get(String(caNumber).trim());
  if (caInfo) {
    // Usamos os nomes de coluna exatos do arquivo que você enviou
    return {
      'Nº do CA': caInfo['CA'],
      'Data de Validade': caInfo['Validade'],
      'Situação': caInfo['Situacao'],
      'Equipamento': caInfo['Equipamento'],
      'Fabricante': caInfo['Fabricante']
    };
  } else {
    return { error: `O CA "${caNumber}" não foi encontrado na base de dados.` };
  }
}

module.exports = { getCAInfo, loadData };