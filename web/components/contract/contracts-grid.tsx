import { Contract } from 'web/lib/firebase/contracts'
import { User } from 'web/lib/firebase/users'
import { Col } from '../layout/col'
import { SiteLink } from '../site-link'
import { ContractCard } from './contract-card'
import { ShowTime } from './contract-details'
import { ContractSearch } from '../contract-search'
import { useIsVisible } from 'web/hooks/use-is-visible'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { LoadingIndicator } from '../loading-indicator'

export type ContractHighlightOptions = {
  contractIds?: string[]
  highlightClassName?: string
}

export function ContractsGrid(props: {
  contracts: Contract[] | undefined
  loadMore: () => void
  hasMore: boolean
  showTime?: ShowTime
  onContractClick?: (contract: Contract) => void
  overrideGridClassName?: string
  cardHideOptions?: {
    hideQuickBet?: boolean
    hideGroupLink?: boolean
  }
  highlightOptions?: ContractHighlightOptions
}) {
  const {
    contracts,
    showTime,
    hasMore,
    loadMore,
    onContractClick,
    overrideGridClassName,
    cardHideOptions,
    highlightOptions,
  } = props
  const { hideQuickBet, hideGroupLink } = cardHideOptions || {}

  const { contractIds, highlightClassName } = highlightOptions || {}
  const [elem, setElem] = useState<HTMLElement | null>(null)
  const isBottomVisible = useIsVisible(elem)

  useEffect(() => {
    if (isBottomVisible && hasMore) {
      loadMore()
    }
  }, [isBottomVisible, hasMore, loadMore])

  if (contracts === undefined) {
    return <LoadingIndicator />
  }

  if (contracts.length === 0) {
    return (
      <p className="mx-2 text-gray-500">
        No markets found. Why not{' '}
        <SiteLink href="/create" className="font-bold text-gray-700">
          create one?
        </SiteLink>
      </p>
    )
  }

  return (
    <Col className="gap-8">
      <ul
        className={clsx(
          overrideGridClassName
            ? overrideGridClassName
            : 'grid w-full grid-cols-1 gap-4 md:grid-cols-2'
        )}
      >
        {contracts.map((contract) => (
          <ContractCard
            contract={contract}
            key={contract.id}
            showTime={showTime}
            onClick={
              onContractClick ? () => onContractClick(contract) : undefined
            }
            hideQuickBet={hideQuickBet}
            hideGroupLink={hideGroupLink}
            className={
              contractIds?.includes(contract.id)
                ? highlightClassName
                : undefined
            }
          />
        ))}
      </ul>
      <div ref={setElem} className="relative -top-96 h-1" />
    </Col>
  )
}

export function CreatorContractsList(props: { creator: User }) {
  const { creator } = props

  return (
    <ContractSearch
      querySortOptions={{
        defaultSort: 'newest',
        defaultFilter: 'all',
        shouldLoadFromStorage: false,
      }}
      additionalFilter={{
        creatorId: creator.id,
      }}
    />
  )
}
