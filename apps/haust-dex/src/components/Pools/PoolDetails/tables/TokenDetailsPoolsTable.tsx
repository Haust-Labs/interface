import PoolTable from 'components/Pools/PoolTable/PoolTable'

export function TokenDetailsPoolsTable({
  referenceToken,
}: {
  referenceToken: string
}) {
  return (
    <div data-testid={`tdp-pools-table-${referenceToken.toLowerCase()}`}>
      <PoolTable
        referenceToken={referenceToken}
      />
    </div>
  )
}
