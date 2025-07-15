/**
 * PDF Cache Service - Cache em memória para PDFs gerados
 * Referência: context7 mcp - NestJS Services Pattern
 */
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

interface CachedPdf {
  buffer: Buffer;
  createdAt: Date;
  lastAccessed: Date;
  hits: number;
}

@Injectable()
export class PdfCacheService {
  private readonly logger = new Logger(PdfCacheService.name);
  private readonly cache = new Map<string, CachedPdf>();
  private readonly maxCacheSize = 100; // Máximo 100 PDFs em cache
  private readonly maxCacheAge = 1000 * 60 * 30; // 30 minutos
  private cleanupInterval: NodeJS.Timeout | null = null;

  onModuleInit(): void {
    // Executar limpeza a cada 10 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 1000 * 60 * 10);

    this.logger.log('PDF Cache Service iniciado');
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
    this.logger.log('PDF Cache Service finalizado');
  }

  /**
   * Gera uma chave única para o cache baseada nos parâmetros
   */
  private generateCacheKey(type: string, params: Record<string, any>): string {
    const paramsString = JSON.stringify(params, Object.keys(params).sort());
    const hash = crypto.createHash('md5').update(`${type}:${paramsString}`).digest('hex');
    return `${type}_${hash}`;
  }

  /**
   * Verifica se um PDF está no cache e ainda é válido
   */
  has(type: string, params: Record<string, any>): boolean {
    const key = this.generateCacheKey(type, params);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return false;
    }

    // Verificar se não expirou
    const age = Date.now() - cached.createdAt.getTime();
    if (age > this.maxCacheAge) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Recupera um PDF do cache
   */
  get(type: string, params: Record<string, any>): Buffer | null {
    const key = this.generateCacheKey(type, params);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Verificar se não expirou
    const age = Date.now() - cached.createdAt.getTime();
    if (age > this.maxCacheAge) {
      this.cache.delete(key);
      return null;
    }

    // Atualizar estatísticas de acesso
    cached.lastAccessed = new Date();
    cached.hits++;

    this.logger.debug(`Cache hit para ${type}: ${key} (${cached.hits} hits)`);
    return cached.buffer;
  }

  /**
   * Armazena um PDF no cache
   */
  set(type: string, params: Record<string, any>, buffer: Buffer): void {
    const key = this.generateCacheKey(type, params);
    
    // Verificar limite de cache
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest();
    }

    const cached: CachedPdf = {
      buffer,
      createdAt: new Date(),
      lastAccessed: new Date(),
      hits: 0,
    };

    this.cache.set(key, cached);
    this.logger.debug(`PDF armazenado no cache: ${type} (${key})`);
  }

  /**
   * Remove o item mais antigo do cache (LRU - Least Recently Used)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, cached] of this.cache.entries()) {
      if (cached.lastAccessed.getTime() < oldestTime) {
        oldestTime = cached.lastAccessed.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.logger.debug(`Item removido do cache por LRU: ${oldestKey}`);
    }
  }

  /**
   * Remove itens expirados do cache
   */
  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, cached] of this.cache.entries()) {
      const age = now - cached.createdAt.getTime();
      if (age > this.maxCacheAge) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.debug(`Limpeza do cache: ${removedCount} itens expirados removidos`);
    }
  }

  /**
   * Limpa todo o cache manualmente
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.log(`Cache limpo: ${size} itens removidos`);
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): {
    size: number;
    maxSize: number;
    maxAge: number;
    items: Array<{
      key: string;
      age: number;
      hits: number;
      lastAccessed: string;
    }>;
  } {
    const now = Date.now();
    const items = Array.from(this.cache.entries()).map(([key, cached]) => ({
      key: key.substring(0, 20) + '...', // Truncar chave para exibição
      age: Math.round((now - cached.createdAt.getTime()) / 1000), // idade em segundos
      hits: cached.hits,
      lastAccessed: cached.lastAccessed.toISOString(),
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      maxAge: Math.round(this.maxCacheAge / 1000), // em segundos
      items,
    };
  }
}