import TransactionTable from 'components/Transactions/TransactionTable/TransactionTable'

export function TransactionsTable({
  referenceToken,
}: {
  referenceToken?: string
}) {
  const columnVisibility = {
    timestamp: true,
    type: true,
    usd: false,
    token0: false,
    token1: false,
    wallet: true
  }
  const gridConfig = {
    desktop: '1fr 3fr 1fr',
    laptop: '1fr 3fr 1fr',
    tablet: '1fr 3fr 1fr',
    mobile: '1fr 2fr'
  }
  return (
    <div data-testid={`tdp-pools-table-${referenceToken?.toLowerCase()}`}>
      <TransactionTable
        columnVisibility={columnVisibility}
        gridConfig={gridConfig}
      />
    </div>
  )
}
