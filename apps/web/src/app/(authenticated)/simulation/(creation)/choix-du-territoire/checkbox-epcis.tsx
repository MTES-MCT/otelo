import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import { TEpci } from '@shared'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import { ComponentProps } from 'react'

type CheckboxEpcisProps = {
  epcis: TEpci[]
  legend?: string
}

export function CheckboxEpcis({ epcis, legend }: CheckboxEpcisProps) {
  const [paramsEpcis, setEpcis] = useQueryState('epcis', parseAsArrayOf(parseAsString).withDefault([]))

  const createOptions = (epcis: TEpci[]): ComponentProps<typeof Checkbox>['options'] =>
    epcis.map((epci) => ({
      label: epci.name,
      nativeInputProps: {
        checked: paramsEpcis.includes(epci.code),
        name: epci.name,
        onChange: (e) => {
          const newEpcis = e.target.checked ? [...paramsEpcis, e.target.value] : paramsEpcis.filter((code) => code !== e.target.value)
          setEpcis(newEpcis)
        },
        value: epci.code,
      },
    }))

  return <Checkbox options={createOptions(epcis)} legend={legend} />
}
