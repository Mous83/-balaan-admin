/**
 * 💾 BALAAN ADMIN CACHE SYSTEM
 * Cache intelligent avec TTL et invalidation
 */

const CACHE_PREFIX = 'balaan_admin_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

class AdminCache {
  static set(key, data, ttl = DEFAULT_TTL) {
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
      console.log('💾 Cache SET:', key, 'TTL:', ttl/1000 + 's');
    } catch (error) {
      console.warn('💾 Cache SET failed:', error);
    }
  }

  static get(key) {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;

      const { data, timestamp, ttl } = JSON.parse(cached);
      
      // Vérifier expiration
      if (Date.now() - timestamp > ttl) {
        this.delete(key);
        console.log('💾 Cache EXPIRED:', key);
        return null;
      }

      console.log('💾 Cache HIT:', key);
      return data;
    } catch (error) {
      console.warn('💾 Cache GET failed:', error);
      this.delete(key);
      return null;
    }
  }

  static delete(key) {
    localStorage.removeItem(CACHE_PREFIX + key);
    console.log('💾 Cache DELETE:', key);
  }

  static clear() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
    console.log('💾 Cache CLEARED');
  }

  static invalidatePattern(pattern) {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX) && key.includes(pattern))
      .forEach(key => localStorage.removeItem(key));
    console.log('💾 Cache INVALIDATED pattern:', pattern);
  }

  // Méthodes spécialisées
  static async getStats(forceRefresh = false) {
    const cacheKey = 'dashboard_stats';
    
    if (!forceRefresh) {
      const cached = this.get(cacheKey);
      if (cached) return cached;
    }

    // Si pas en cache, on retourne null pour déclencher le fetch
    return null;
  }

  static setStats(stats) {
    this.set('dashboard_stats', stats, 3 * 60 * 1000); // 3 minutes pour les stats
  }

  static async getSalons(page = 1, forceRefresh = false) {
    const cacheKey = `salons_page_${page}`;
    
    if (!forceRefresh) {
      const cached = this.get(cacheKey);
      if (cached) return cached;
    }

    return null;
  }

  static setSalons(salons, page = 1) {
    this.set(`salons_page_${page}`, salons, 2 * 60 * 1000); // 2 minutes pour les salons
  }

  static async getUsers(page = 1, forceRefresh = false) {
    const cacheKey = `users_page_${page}`;
    
    if (!forceRefresh) {
      const cached = this.get(cacheKey);
      if (cached) return cached;
    }

    return null;
  }

  static setUsers(users, page = 1) {
    this.set(`users_page_${page}`, users, 5 * 60 * 1000); // 5 minutes pour les users
  }

  static getKycData(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = this.get('kyc_data');
      if (cached) return cached;
    }
    return null;
  }

  static setKycData(data) {
    this.set('kyc_data', data, 1 * 60 * 1000); // 1 minute pour KYC (plus sensible)
  }

  // Invalidation intelligente
  static onSalonUpdate(salonId) {
    this.invalidatePattern('salons');
    this.invalidatePattern('stats');
    this.invalidatePattern('kyc');
    console.log('💾 Invalidated salon-related cache');
  }

  static onKycUpdate() {
    this.invalidatePattern('kyc');
    this.invalidatePattern('stats');
    console.log('💾 Invalidated KYC-related cache');
  }

  static onUserUpdate() {
    this.invalidatePattern('users');
    this.invalidatePattern('stats');
    console.log('💾 Invalidated user-related cache');
  }
}

// Auto-cleanup au démarrage
AdminCache.clear();

export default AdminCache;
