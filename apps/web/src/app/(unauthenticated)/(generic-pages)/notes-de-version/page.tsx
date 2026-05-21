import type { Metadata } from 'next'
import { getReleaseNotesSections } from './release-notes'

export const metadata: Metadata = {
  title: 'Notes de version',
}

export default function NotesDeVersionPage() {
  const sections = getReleaseNotesSections()

  return (
    <>
      <h1>Notes de version</h1>
      <p>Consultez ici les nouveautés d&apos;Otelo, mois par mois.</p>

      {sections.map((section) => (
        <section key={section.id}>
          <h2 id={section.id}>{section.label}</h2>
          {section.items.length > 0 ? (
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Historique en cours de consolidation pour cette période.</p>
          )}
        </section>
      ))}
    </>
  )
}
