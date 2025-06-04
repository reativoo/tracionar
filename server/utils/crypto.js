const crypto = require('crypto');

class CryptoUtils {
  constructor() {
    // Usar JWT_SECRET como base para a chave de criptografia
    this.algorithm = 'aes-256-gcm';
    this.secretKey = this.deriveKey(process.env.JWT_SECRET);
  }

  // Derivar chave de 32 bytes a partir do JWT_SECRET
  deriveKey(secret) {
    return crypto.scryptSync(secret, 'tracionar-salt', 32);
  }

  // Criptografar texto
  encrypt(text) {
    try {
      if (!text) return null;

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.secretKey);
      cipher.setAAD(Buffer.from('tracionar'));

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Combinar IV, AuthTag e dados criptografados
      const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
      
      return combined;
    } catch (error) {
      throw new Error('Erro ao criptografar dados: ' + error.message);
    }
  }

  // Descriptografar texto
  decrypt(encryptedData) {
    try {
      if (!encryptedData) return null;

      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Formato de dados criptografados inválido');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
      decipher.setAuthTag(authTag);
      decipher.setAAD(Buffer.from('tracionar'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Erro ao descriptografar dados: ' + error.message);
    }
  }

  // Gerar hash seguro (para senhas adicionais se necessário)
  hash(text, salt = null) {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(text, actualSalt, 64).toString('hex');
    return { hash, salt: actualSalt };
  }

  // Verificar hash
  verifyHash(text, hash, salt) {
    const testHash = crypto.scryptSync(text, salt, 64).toString('hex');
    return testHash === hash;
  }

  // Gerar token aleatório seguro
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Validar se uma string está criptografada
  isEncrypted(data) {
    if (!data || typeof data !== 'string') return false;
    const parts = data.split(':');
    return parts.length === 3;
  }
}

module.exports = new CryptoUtils();