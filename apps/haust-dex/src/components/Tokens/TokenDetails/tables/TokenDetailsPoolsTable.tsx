import { ApolloError } from '@apollo/client'
import { Token } from '@uniswap/sdk-core'
import PoolTable from 'components/Pools/PoolTable/PoolTable'
import { sortAscendingAtom, sortMethodAtom } from 'components/Pools/state'
import { OrderDirection } from 'graphql/data/util'
import usePollsData from 'graphql/thegraph/PollsDataQuery'
import { useAtomValue, useResetAtom } from 'jotai/utils'
import ms from 'ms.macro'
import { useEffect, useMemo } from 'react'


export function TokenDetailsPoolsTable({
  referenceToken,
}: {
  referenceToken: string
}) {
  const { isLoading, error, data } = usePollsData(ms`30s`)
 
  const allDataStillLoading = isLoading && !data?.pools?.length

  const filteredPools = useMemo(() => {
    return data?.pools?.filter(pool => 
      pool.token0.id === referenceToken || pool.token1.id === referenceToken
    )
  }, [data?.pools, referenceToken])

  return (
    <div data-testid={`tdp-pools-table-${referenceToken.toLowerCase()}`}>
      <PoolTable
        poolsData={filteredPools}
        loading={allDataStillLoading}
      />
    </div>
  )
}
