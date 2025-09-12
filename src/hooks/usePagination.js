/**
 * 📄 HOOK DE PAGINATION AVANCÉE
 * Avec lazy loading et cache intelligent
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '../config/firebase';
import AdminCache from '../utils/cache';
import { trackAdminAction } from '../utils/analytics';

export const usePagination = (collectionName, pageSize = 20, orderField = 'created_time', orderDirection = 'desc') => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [lastDoc, setLastDoc] = useState(null);
  const [error, setError] = useState(null);

  // Cache key basé sur la collection et les paramètres
  const getCacheKey = useCallback((page) => {
    return `${collectionName}_${orderField}_${orderDirection}_${pageSize}_page_${page}`;
  }, [collectionName, orderField, orderDirection, pageSize]);

  // Charger le compte total
  const loadTotalCount = useCallback(async () => {
    try {
      const cacheKey = `${collectionName}_total_count`;
      const cached = AdminCache.get(cacheKey);
      
      if (cached) {
        setTotalCount(cached);
        return cached;
      }

      const collectionRef = collection(db, collectionName);
      const snapshot = await getCountFromServer(collectionRef);
      const count = snapshot.data().count;
      
      setTotalCount(count);
      AdminCache.set(cacheKey, count, 60 * 1000); // Cache 1 minute
      
      return count;
    } catch (error) {
      console.error('Erreur count:', error);
      return 0;
    }
  }, [collectionName]);

  // Charger une page
  const loadPage = useCallback(async (page = 1, forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier le cache
      if (!forceRefresh) {
        const cacheKey = getCacheKey(page);
        const cached = AdminCache.get(cacheKey);
        
        if (cached) {
          setItems(cached.items);
          setLastDoc(cached.lastDoc);
          setHasMore(cached.hasMore);
          setCurrentPage(page);
          setLoading(false);
          return cached.items;
        }
      }

      // Construire la requête
      const collectionRef = collection(db, collectionName);
      let q = query(
        collectionRef,
        orderBy(orderField, orderDirection),
        limit(pageSize)
      );

      // Si ce n'est pas la première page, utiliser startAfter
      if (page > 1 && lastDoc) {
        q = query(
          collectionRef,
          orderBy(orderField, orderDirection),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const newItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Normaliser les champs de date
        created_at: doc.data().created_time?.toDate?.() || doc.data().created_at?.toDate?.() || new Date(),
        updated_at: doc.data().updated_time?.toDate?.() || doc.data().updated_at?.toDate?.() || new Date()
      }));

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1];
      const newHasMore = snapshot.docs.length === pageSize;

      // Mettre à jour l'état
      setItems(newItems);
      setLastDoc(newLastDoc);
      setHasMore(newHasMore);
      setCurrentPage(page);

      // Mettre en cache
      const cacheData = {
        items: newItems,
        lastDoc: newLastDoc,
        hasMore: newHasMore
      };
      AdminCache.set(getCacheKey(page), cacheData, 2 * 60 * 1000); // Cache 2 minutes

      // Analytics
      trackAdminAction('pagination_load', collectionName, {
        page,
        items_count: newItems.length,
        has_more: newHasMore
      });

      return newItems;
    } catch (error) {
      console.error('Erreur pagination:', error);
      setError(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [collectionName, orderField, orderDirection, pageSize, lastDoc, getCacheKey]);

  // Charger la page suivante
  const loadNext = useCallback(() => {
    if (hasMore && !loading) {
      loadPage(currentPage + 1);
    }
  }, [hasMore, loading, currentPage, loadPage]);

  // Charger la page précédente
  const loadPrevious = useCallback(() => {
    if (currentPage > 1) {
      loadPage(currentPage - 1);
    }
  }, [currentPage, loadPage]);

  // Rafraîchir
  const refresh = useCallback(() => {
    AdminCache.invalidatePattern(collectionName);
    loadPage(1, true);
    loadTotalCount();
  }, [collectionName, loadPage, loadTotalCount]);

  // Aller à une page spécifique
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= Math.ceil(totalCount / pageSize)) {
      loadPage(page);
    }
  }, [totalCount, pageSize, loadPage]);

  // Charger au montage
  useEffect(() => {
    loadPage(1);
    loadTotalCount();
  }, [loadPage, loadTotalCount]);

  return {
    // Données
    items,
    loading,
    error,
    hasMore,
    currentPage,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    
    // Actions
    loadNext,
    loadPrevious,
    refresh,
    goToPage,
    
    // Utilitaires
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === Math.ceil(totalCount / pageSize),
    pageSize
  };
};

export default usePagination;
