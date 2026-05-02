const mongoose = require('mongoose');
const config = require('../config');

module.exports = async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(config.mongoUri);
    console.log('[DB] ✅ Conectado ao MongoDB com sucesso!');
  } catch (err) {
    console.error('[DB] ❌ Erro ao conectar ao MongoDB:', err.message);
    console.log('[DB] ⚠️ O bot continuará sem banco de dados. Algumas funções podem não funcionar.');
  }
};
