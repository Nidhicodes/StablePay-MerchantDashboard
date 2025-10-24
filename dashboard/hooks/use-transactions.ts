import { useState, useEffect, useMemo } from 'react';
import { transactionService, TransactionEvent } from '@/lib/transaction-service';

<<<<<<< Updated upstream
// Cache transactions in localStorage
const CACHE_KEY_PREFIX = 'stablepay_transactions';
=======
const CACHE_KEY = 'all_transactions';
>>>>>>> Stashed changes
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CachedData {
    transactions: (Omit<TransactionEvent, 'blockNumber'> & { blockNumber: string })[];
    timestamp: number;
}

<<<<<<< Updated upstream
export function useTransactions(walletAddress: string | null) {
    const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
=======
export function useTransactions() {
    const [allTransactions, setAllTransactions] = useState<TransactionEvent[]>([]);
>>>>>>> Stashed changes
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);
    const [walletFilter, setWalletFilter] = useState<string>('');

<<<<<<< Updated upstream
    const getCacheKey = () => walletAddress ? `${CACHE_KEY_PREFIX}_${walletAddress}` : null;

    // Load cached data on mount
=======
>>>>>>> Stashed changes
    useEffect(() => {
        const cacheKey = getCacheKey();
        if (!cacheKey) return;

        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { transactions: cachedTransactions, timestamp }: CachedData = JSON.parse(cached);
                const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

                if (!isExpired) {
                    const restoredTransactions = cachedTransactions.map(event => ({
                        ...event,
                        blockNumber: BigInt(event.blockNumber)
                    }));
                    setAllTransactions(restoredTransactions);
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
<<<<<<< Updated upstream
            const events = await transactionService.fetchStableCoinPurchases(walletAddress);
            setTransactions(events);
=======
            const events = await transactionService.fetchStableCoinPurchases();
            setAllTransactions(events);
>>>>>>> Stashed changes
            setHasFetched(true);

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
<<<<<<< Updated upstream
        const cacheKey = getCacheKey();
        if (cacheKey) {
            localStorage.removeItem(cacheKey);
        }
        setTransactions([]);
=======
        localStorage.removeItem(CACHE_KEY);
        setAllTransactions([]);
>>>>>>> Stashed changes
        setHasFetched(false);
    };

    const filteredTransactions = useMemo(() => {
        if (!walletFilter.trim()) {
            return allTransactions;
        }
        
        const normalizedFilter = walletFilter.toLowerCase().trim();
        
        return allTransactions.filter(tx => {
            const buyer = tx.buyer.toLowerCase();
            const receiver = tx.receiver.toLowerCase();
            const txHash = tx.transactionHash.toLowerCase();
            
            return buyer.includes(normalizedFilter) || 
                   receiver.includes(normalizedFilter) ||
                   txHash.includes(normalizedFilter);
        });
    }, [allTransactions, walletFilter]);

    return {
        transactions: filteredTransactions,
        allTransactions,
        loading,
        error,
        hasFetched,
        fetchTransactions,
        clearCache,
        walletFilter,
        setWalletFilter
    };
}