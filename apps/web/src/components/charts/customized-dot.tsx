export const CustomizedDot = (props: { cx?: number; cy?: number; period: string | undefined; stroke: string; year: string }) => {
  const { cx, cy, period, stroke, year } = props
  if (cx === undefined || cy === undefined) return null

  if (Number(period) === Number(year)) {
    return <circle cx={cx} cy={cy} r={5} stroke={stroke} strokeWidth={2} fill={stroke} />
  }

  return <circle cx={cx} cy={cy} r={3} stroke={stroke} strokeWidth={1} fill="white" />
}
