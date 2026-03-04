import { getReleaseNotesSections } from '../../notes-de-version/release-notes'
import { Summary } from '../summary'

export default function SummarySlot() {
  const sections = getReleaseNotesSections()

  return (
    <Summary
      items={sections.map((section) => ({
        linkProps: {
          href: `#${section.id}`,
        },
        text: section.label,
      }))}
    />
  )
}
