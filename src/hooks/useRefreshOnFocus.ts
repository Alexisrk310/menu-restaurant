import { useEffect, useRef } from 'react';

export function useRefreshOnFocus(refetch: () => Promise<any> | void) {
    const refetchRef = useRef(refetch);

    useEffect(() => {
        refetchRef.current = refetch;
    }, [refetch]);

    useEffect(() => {
        const onFocus = () => {
            refetchRef.current();
        };

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onFocus);

        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onFocus);
        };
    }, []);
}
