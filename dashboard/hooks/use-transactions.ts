import { useState, useEffect } from 'react';
import { transactionService, TransactionEvent } from '@/lib/transaction-service';

// Cache transactions in localStorage
const CACHE_KEY_PREFIX = 'stablepay_transactions';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CachedData {
    transactions: (Omit<TransactionEvent, 'blockNumber'> & { blockNumber: string })[];
    timestamp: number;
}

export function useTransactions(walletAddress: string | null) {
    const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);

    const getCacheKey = () => walletAddress ? `${CACHE_KEY_PREFIX}_${walletAddress}` : null;

    // Load cached data on mount
    useEffect(() => {
        const cacheKey = getCacheKey();
        if (!cacheKey) return;

        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { transactions: cachedTransactions, timestamp }: CachedData = JSON.parse(cached);
                const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

                if (!isExpired && cachedTransactions.length > 0) {
                    // Convert string blockNumber back to BigInt
                    const restoredTransactions = cachedTransactions.map(event => ({
                        ...event,
                        blockNumber: BigInt(event.blockNumber)
                    }));
                    setTransactions(restoredTransactions);
                    setHasFetched(true);
                }
            } catch (err) {
                console.warn('Failed to parse cached transactions:', err);
            }
        }
    }, [walletAddress]);

    const fetchTransactions = async () => {
        if (!walletAddress) return;

        try {
            setLoading(true);
            setError(null);
            const events = await transactionService.fetchStableCoinPurchases(walletAddress);
            setTransactions(events);
            setHasFetched(true);

            // Cache the data (convert BigInt to string for serialization)
            const serializableEvents = events.map(event => ({
                ...event,
                blockNumber: event.blockNumber.toString()
            }));

            const cacheData: CachedData = {
                transactions: serializableEvents as any,
                timestamp: Date.now()
            };
            const cacheKey = getCacheKey();
            if (cacheKey) {
                localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            }
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    const clearCache = () => {
        const cacheKey = getCacheKey();
        if (cacheKey) {
            localStorage.removeItem(cacheKey);
        }
        setTransactions([]);
        setHasFetched(false);
    };

    return {
        transactions,
        loading,
        error,
        hasFetched,
        fetchTransactions,
        clearCache
    };
}