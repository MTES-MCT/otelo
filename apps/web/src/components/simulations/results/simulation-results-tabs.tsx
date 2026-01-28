'use client'

import { RiIconClassName } from '@codegouvfr/react-dsfr'
import Tabs from '@codegouvfr/react-dsfr/Tabs'
import { useQueryState } from 'nuqs'
import styles from './simulation-results-tabs.module.css'

export const SimulationResultsTabs = ({
  tabs,
}: {
  tabs: {
    content: React.ReactElement
    iconId: RiIconClassName
    label: string
    tabId: string
  }[]
}) => {
  const [epci, setEpci] = useQueryState('epci')
  const selectedTabId = epci as string

  const tabsProps = tabs.map(({ content, ...tabProps }) => tabProps)

  return (
    <Tabs
      className={styles.itemsList}
      classes={{ panel: styles.mainContainer }}
      tabs={tabsProps}
      onTabChange={setEpci}
      selectedTabId={selectedTabId}
    >
      {tabs.find((tab) => tab.tabId === selectedTabId)?.content || tabs[0].content}
    </Tabs>
  )
}
