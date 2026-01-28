import { Summary } from '../summary'

export default function SummarySlot() {
  return (
    <Summary
      items={[
        {
          linkProps: {
            href: '#titre1',
          },
          text: 'Accès direct',
        },
        {
          linkProps: {
            href: '#titre2',
          },
          text: 'Accès direct',
        },
        {
          linkProps: {
            href: '#titre3',
          },
          text: 'Accès direct',
        },
      ]}
    />
  )
}
