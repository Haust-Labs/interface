import {api} from "api/axios";
import {useCallback, useEffect, useState} from "react";

import {TokenApi} from "./types";

interface UseSearchTokensReturnValue {
  data: TokenApi[];
  loading: boolean;
}

function useSearchTokensQuery(searchString: string): { data: TokenApi[], loading: boolean }  {
  const [topTokensData, setTopTokensData] = useState([]);
  const [loading, setLoading] = useState(false);
  const query = useCallback(
    async () => {
      setLoading(true);
      try {
        if (searchString !== '') {
          const { data } = await api.get('/tokens/token_search/', { params: { searchString } });
          setTopTokensData(data)
        } else {
          setTopTokensData([]);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    },
    [searchString],
  );

  useEffect(() => {
    query();
  }, [query]);

  return { data: topTokensData, loading };
}

export const useSearchTokensApi = (searchValue: string): UseSearchTokensReturnValue => {
  const { data, loading } = useSearchTokensQuery(searchValue);
  return { data, loading };
}