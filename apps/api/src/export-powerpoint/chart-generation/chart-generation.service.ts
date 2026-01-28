import { Injectable, Logger } from '@nestjs/common'
import * as puppeteer from 'puppeteer'
import { TResults } from '~/schemas/results/results'
import { chartKeyColors } from './colors'

// todo: use zod schema instead and type it in the export-powerpoint calculators
interface ChartConfig {
  type:
    | 'projection-population-evolution'
    | 'projection-menages-evolution'
    | 'bad-housing'
    | 'comparison-population-evolution-housing-needs'
    | 'vacant-accommodation'
    | 'annual-needs'
    | 'annual-needs-comparison'
  data: unknown
  metadata?: Record<string, unknown>
  width: number
  height: number
}

@Injectable()
export class ChartGenerationService {
  private readonly logger = new Logger(ChartGenerationService.name)

  async generateChartImage(chartConfig: ChartConfig): Promise<Buffer> {
    this.logger.verbose(`Generating chart image for ${chartConfig.type}`)
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    })

    const page = await browser.newPage()

    const width = chartConfig.width || 800
    const height = chartConfig.height || 500

    const scale = 2
    const scaledWidth = width * scale
    const scaledHeight = height * scale

    await page.setViewport({
      width: scaledWidth,
      height: scaledHeight,
      deviceScaleFactor: scale,
    })

    const html = this.generateRechartsHTML(chartConfig, scale)
    await page.setContent(html)

    await page.waitForFunction(
      () => {
        const canvas = document.querySelector('canvas')
        return canvas && canvas.width > 0
      },
      { timeout: 5000 },
    )

    const screenshot = await page.screenshot({
      type: 'png',
      omitBackground: false,
      clip: {
        x: 0,
        y: 0,
        width: scaledWidth,
        height: scaledHeight,
      },
    })
    await browser.close()
    return Buffer.from(screenshot)
  }

  private generateRechartsHTML(chartConfig: ChartConfig, scale: number = 1): string {
    switch (chartConfig.type) {
      case 'projection-population-evolution':
        return this.generatePopulationChart(chartConfig, scale)
      case 'projection-menages-evolution':
        return this.generateMenagesChart(chartConfig, scale)
      case 'bad-housing':
        return this.generateBadHousingChart(chartConfig, scale)
      case 'comparison-population-evolution-housing-needs':
        return this.generateComparisonPopulationChart(chartConfig, scale)
      case 'vacant-accommodation':
        return this.generateVacantAccommodationChart(chartConfig, scale)
      case 'annual-needs-comparison':
        return this.generateComparisonHousingNeedsChart(chartConfig, scale)
      case 'annual-needs':
        return this.generateAnnualNeedsChart(chartConfig, scale)
      default:
        throw new Error('Invalid chart type')
    }
  }

  private generatePopulationChart(chartConfig: ChartConfig, scale: number = 1): string {
    const width = chartConfig.width || 800
    const height = chartConfig.height || 500
    const scaledWidth = width * scale
    const scaledHeight = height * scale
    const padding = 20 * scale
    const chartWidth = scaledWidth - padding * 2
    const chartHeight = scaledHeight - padding * 2

    return `
     <!DOCTYPE html>
      <html>

      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">

          <style>
              body {
                  margin: 0;
                  padding: ${padding}px;
                  background: white;
                  font-family: 'Calibri', Arial, sans-serif;
                  width: ${scaledWidth}px;
                  height: ${scaledHeight}px;
                  overflow: hidden;
                  box-sizing: border-box;
              }

              #myChart {
                  width: ${chartWidth}px;
                  height: ${chartHeight}px;
              }
          </style>
      </head>

      <body>
          <div>
              <canvas id="myChart"></canvas>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

          <script>
              const ctx = document.getElementById('myChart');

              const demographicData = ${JSON.stringify(chartConfig.data)};
              
              const chart = new Chart(ctx, {
                  type: 'line',
                  data: {
                      labels: demographicData.map(item => item.year),
                      datasets: [
                          {
                              label: 'Central',
                              data: demographicData.map(item => item.central),
                              borderColor: '${chartKeyColors.central}',
                              backgroundColor: '${chartKeyColors.central}33',
                              tension: 0.1,
                              fill: false
                          },
                          {
                              label: 'Haute',
                              data: demographicData.map(item => item.haute),
                              borderColor: '${chartKeyColors.haute}',
                              backgroundColor: '${chartKeyColors.haute}33',
                              tension: 0.1,
                              fill: false
                          },
                          {
                              label: 'Basse',
                              data: demographicData.map(item => item.basse),
                              borderColor: '${chartKeyColors.basse}',
                              backgroundColor: '${chartKeyColors.basse}33',
                              tension: 0.1,
                              fill: false
                          }
                      ]
                  },
                  options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      animation: false,
                      layout: {
                          padding: {
                              top: 10,
                              right: 10,
                              bottom: 10,
                              left: 10
                          }
                      },
                      scales: {
                          x: {
                              title: {
                                  display: true,
                                  text: 'Année'
                              }
                          },
                          y: {
                              title: {
                                  display: true,
                                  text: 'Évolution'
                              },
                              beginAtZero: false,
                              min: ${JSON.stringify(chartConfig.metadata?.min)},
                              max: ${JSON.stringify(chartConfig.metadata?.max)}
                          }
                      },
                      plugins: {
                          legend: {
                              display: true,
                              position: 'top'
                          }
                      }
                  }
              });
          </script>
      </body>

      </html>
    `
  }

  private generateMenagesChart(chartConfig: ChartConfig, scale: number = 1): string {
    const width = chartConfig.width || 800
    const height = chartConfig.height || 500
    const scaledWidth = width * scale
    const scaledHeight = height * scale
    const padding = 20 * scale
    const chartWidth = scaledWidth - padding * 2
    const chartHeight = scaledHeight - padding * 2

    const dsfrLinePalette = [chartKeyColors.centralH, chartKeyColors.centralC, chartKeyColors.centralB]
    const palette = dsfrLinePalette
    const defaultLines = [
      {
        dataKey: 'centralH',
        name: 'Décohabitation accélérée',
        strokeWidth: 2,
      },
      {
        dataKey: 'centralC',
        name: 'Décohabitation tendancielle',
        strokeWidth: 2,
      },
      {
        dataKey: 'centralB',
        name: 'Décohabitation décélérée',
        strokeWidth: 2,
      },
    ]

    const lines = defaultLines

    const rawData = chartConfig.data as unknown
    let menagesData: Array<Record<string, number>> = Array.isArray(rawData) ? (rawData as Array<Record<string, number>>) : []
    let metadata = chartConfig.metadata as { min?: number; max?: number } | undefined

    if (!menagesData.length && rawData && typeof rawData === 'object') {
      // biome-ignore lint/suspicious/noExplicitAny: todo
      const values = Object.values(rawData as Record<string, any>)

      for (const entry of values) {
        if (entry && typeof entry === 'object' && Array.isArray(entry.data)) {
          menagesData = entry.data
          if (!metadata && entry.metadata) {
            metadata = entry.metadata
          }
          break
        }
      }
    }

    if (!metadata || typeof metadata.min !== 'number' || typeof metadata.max !== 'number') {
      const collectedValues: number[] = []
      menagesData.forEach((item) => {
        lines.forEach((line) => {
          const value = Number(item[line.dataKey])
          if (!Number.isNaN(value)) {
            collectedValues.push(value)
          }
        })
      })

      if (collectedValues.length) {
        metadata = {
          min: Math.min(...collectedValues),
          max: Math.max(...collectedValues),
        }
      } else {
        metadata = {}
      }
    }

    const datasetsConfig = lines.map((line, index) => ({
      dataKey: line.dataKey,
      label: line.name || line.dataKey,
      color: palette[index % palette.length],
      strokeWidth: line.strokeWidth ?? 2,
    }))

    const menagesDataJson = JSON.stringify(menagesData)
    const datasetsConfigJson = JSON.stringify(datasetsConfig)
    // todo - arrondir a l'entier superieur ou inferieur
    const yAxisMin = typeof metadata?.min === 'number' ? metadata.min : null
    const yAxisMax = typeof metadata?.max === 'number' ? metadata.max : null

    return `
     <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding: ${padding}px;
              background: white;
              font-family: 'Calibri', Arial, sans-serif;
              width: ${scaledWidth}px;
              height: ${scaledHeight}px;
              overflow: hidden;
            }

            #menagesChart {
              width: ${chartWidth}px;
              height: ${chartHeight}px;
            }
          </style>
        </head>

        <body>
          <div>
            <canvas id="menagesChart"></canvas>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script>
            const ctx = document.getElementById('menagesChart')

            const menagesData = ${menagesDataJson};
            const datasetsConfig = ${datasetsConfigJson};
            const yAxisMin = ${JSON.stringify(yAxisMin)};
            const yAxisMax = ${JSON.stringify(yAxisMax)};

            const datasets = datasetsConfig.map((config, index) => ({
              label: config.label,
              data: menagesData.map((item) => {
                const value = item[config.dataKey]
                return typeof value === 'number' ? value : null
              }),
              borderColor: config.color,
              backgroundColor: config.color,
              borderWidth: config.strokeWidth || 2,
              tension: 0.2,
              pointRadius: 0,
              fill: false,
              spanGaps: true,
            }))

            new Chart(ctx, {
              type: 'line',
              data: {
                labels: menagesData.map((item) => item.year),
                datasets,
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                layout: {
                  padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                  }
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Année',
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Nombre de ménages',
                    },
                    beginAtZero: false,
                    min: yAxisMin,
                    max: yAxisMax,
                  },
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                  },
                },
              },
            })
          </script>
        </body>
      </html>
    `
  }

  private generateBadHousingChart(chartConfig: ChartConfig, scale: number = 1): string {
    const width = chartConfig.width || 800
    const height = chartConfig.height || 500
    const scaledWidth = width * scale
    const scaledHeight = height * scale
    const padding = 20 * scale
    const chartWidth = scaledWidth - padding * 2
    const chartHeight = scaledHeight - padding * 2

    const dsfrBarPalette = [
      chartKeyColors.noAccommodation,
      chartKeyColors.hosted,
      chartKeyColors.financialInadequation,
      chartKeyColors.badQuality,
      chartKeyColors.physicalInadequation,
    ]

    const palette = dsfrBarPalette

    const data = chartConfig.data as {
      name: string
      hosted: { total: number }
      noAccommodation: { total: number }
      badQuality: number
      financialInadequation: number
      physicalInadequation: number
    }

    const labels = [data.name]

    const datasets = [
      {
        label: 'Sans logement',
        backgroundColor: palette[0],
        borderColor: palette[0],
        borderWidth: 1,
        data: [data.noAccommodation.total],
      },
      {
        label: 'Hébergés',
        backgroundColor: palette[1],
        borderColor: palette[1],
        borderWidth: 1,
        data: [data.hosted.total],
      },
      {
        label: 'Inadéquation financière',
        backgroundColor: palette[2],
        borderColor: palette[2],
        borderWidth: 1,
        data: [data.financialInadequation],
      },
      {
        label: 'Mauvaise qualité',
        backgroundColor: palette[3],
        borderColor: palette[3],
        borderWidth: 1,
        data: [data.badQuality],
      },
      {
        label: 'Inadéquation physique',
        backgroundColor: palette[4],
        borderColor: palette[4],
        borderWidth: 1,
        data: [data.physicalInadequation],
      },
    ]

    return `
     <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding: ${padding}px;
              background: white;
              font-family: 'Calibri', Arial, sans-serif;
              width: ${scaledWidth}px;
              height: ${scaledHeight}px;
              overflow: hidden;
              box-sizing: border-box;
            }

            #badHousingChart {
              width: ${chartWidth}px;
              height: ${chartHeight}px;
            }
          </style>
        </head>

        <body>
          <div>
            <canvas id="badHousingChart"></canvas>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script>
            const ctx = document.getElementById('badHousingChart')
            const labels = ${JSON.stringify(labels)};
            const datasets = ${JSON.stringify(datasets)};

            new Chart(ctx, {
              type: 'bar',
              data: {
                labels,
                datasets,
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                layout: {
                  padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                  }
                },
                scales: {
                  x: {
                    stacked: false,
                  },
                  y: {
                    beginAtZero: true,
                  },
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: {
                      font: {
                        size: ${Math.round(14 * scale)}
                      }
                    }
                  },
                },
              },
            })
          </script>
        </body>
      </html>
    `
  }

  private generateComparisonPopulationChart(chartConfig: ChartConfig, scale: number = 1): string {
    const width = chartConfig.width || 800
    const height = chartConfig.height || 500
    const scaledWidth = width * scale
    const scaledHeight = height * scale
    const padding = 20 * scale
    const chartWidth = scaledWidth - padding * 2
    const chartHeight = scaledHeight - padding * 2

    const data = chartConfig.data as {
      housingNeeds: Record<number, number>
      populationEvolution: Record<string, { data: Array<{ year: number; central: number; haute: number; basse: number }> }>
      selectedScenario: string
    }

    const populationData = Object.values(data.populationEvolution)[0]?.data || []
    const housingNeedsData = data.housingNeeds
    const selectedScenario = data.selectedScenario

    const years = populationData.map((item) => item.year)
    const labels = years.map((year) => year.toString())

    const housingNeedsValues = years.map((year) => housingNeedsData[year] || 0)

    const populationValues = populationData.map((item) => item[selectedScenario as keyof typeof item] as number)

    // Calculate scale limits
    const maxHousingNeeds = Math.max(...housingNeedsValues.filter((v) => v > 0))
    const minPopulation = Math.min(...populationValues)
    const maxPopulation = Math.max(...populationValues)

    const scenarioLabels = {
      central: 'Population - Central',
      haute: 'Population - Haute',
      basse: 'Population - Basse',
    }

    const scenarioColors = {
      central: chartKeyColors.central,
      haute: chartKeyColors.haute,
      basse: chartKeyColors.basse,
    }

    const housingNeedsColor = chartKeyColors.housingNeeds
    const housingNeedsBgColor = chartKeyColors.housingNeeds + '88'

    return `
     <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding: ${padding}px;
              box-sizing: border-box;
              background: white;
              font-family: 'Calibri', Arial, sans-serif;
              width: ${scaledWidth}px;
              height: ${scaledHeight}px;
              overflow: hidden;
            }

            #comparisonChart {
              width: ${chartWidth}px;
              height: ${chartHeight}px;
            }
          </style>
        </head>

        <body>
          <div>
            <canvas id="comparisonChart"></canvas>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script>
            const ctx = document.getElementById('comparisonChart')
            const labels = ${JSON.stringify(labels)};
            const housingNeedsValues = ${JSON.stringify(housingNeedsValues)};
            const populationValues = ${JSON.stringify(populationValues)};
            const selectedScenario = ${JSON.stringify(selectedScenario)};
            const scenarioLabels = ${JSON.stringify(scenarioLabels)};
            const scenarioColors = ${JSON.stringify(scenarioColors)};

            new Chart(ctx, {
              type: 'bar',
              data: {
                labels,
                datasets: [
                  {
                    label: 'Constructions neuves',
                    type: 'bar',
                    data: housingNeedsValues,
                    backgroundColor: '${housingNeedsBgColor}',
                    borderColor: '${housingNeedsColor}',
                    borderWidth: 1,
                    yAxisID: 'y1'
                  },
                  {
                    label: scenarioLabels[selectedScenario],
                    type: 'line',
                    data: populationValues,
                    borderColor: scenarioColors[selectedScenario],
                    backgroundColor: scenarioColors[selectedScenario] + '33',
                    tension: 0.1,
                    fill: false,
                    yAxisID: 'y2'
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                layout: {
                  padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                  }
                },
                scales: {
                  y1: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    max: ${Math.ceil(maxHousingNeeds * 1.1)},
                    title: {
                      display: true,
                      text: 'Constructions neuves'
                    }
                  },
                  y2: {
                    type: 'linear',
                    position: 'right',
                    min: ${Math.floor(minPopulation * 0.99)},
                    max: ${Math.ceil(maxPopulation * 1.01)},
                    title: {
                      display: true,
                      text: "Évolution du nombre d'habitant"
                    },
                    grid: {
                      drawOnChartArea: false,
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top'
                  }
                }
              }
            })
          </script>
        </body>
      </html>
    `
  }

  private generateVacantAccommodationChart(chartConfig: ChartConfig, scale: number = 1): string {
    const width = chartConfig.width || 800
    const height = chartConfig.height || 500
    const scaledWidth = width * scale
    const scaledHeight = height * scale
    const padding = 20 * scale
    const topPadding = 40 * scale // Extra padding for legends/titles
    const chartWidth = scaledWidth - padding * 2
    const chartHeight = scaledHeight - padding - topPadding

    const data = chartConfig.data as {
      linearChart: Record<
        string,
        {
          data: Array<{ year: number; [key: string]: number }>
          metadata: { min: number; max: number }
          epci: { name: string }
        }
      >
      tableData: Record<
        string,
        {
          name: string
          annualEvolution?: {
            [yearRange: string]: {
              value: number
            }
          }
        }
      >
    }

    const linearDataKey = 'vacant'
    const lineChartTitle = 'Évolution du nombre de logements vacants en volume'
    const barChartTitle = 'Évolution annuelle moyenne du nombre de logements vacants'

    const epcisLinearChart = Object.keys(data.linearChart)

    const allMetadata = epcisLinearChart.map((epci) => data.linearChart[epci].metadata)
    const minValues = allMetadata.map((m) => m.min)
    const maxValues = allMetadata.map((m) => m.max)
    const globalMin = Math.min(...minValues)
    const globalMax = Math.max(...maxValues)
    const yAxisPadding = (globalMax - globalMin) * 0.05
    const yAxisMin = Math.max(0, Math.round(globalMin - yAxisPadding))
    const yAxisMax = Math.round(globalMax + yAxisPadding)

    const lineDatasets = epcisLinearChart.map((epci, index) => {
      const epciData = data.linearChart[epci]
      const color = chartKeyColors[linearDataKey] || `hsl(${index * 60}, 70%, 50%)`
      return {
        label: epciData.epci.name,
        data: epciData.data.map((item) => ({ x: item.year, y: item[linearDataKey] })),
        borderColor: color,
        backgroundColor: color + '33',
        tension: 0.1,
        fill: false,
      }
    })

    const barChart = Object.entries(data.tableData)
      .filter(([key]) => epcisLinearChart.includes(key))
      .map(([key, value]) => {
        return {
          '2010-2015': value.annualEvolution?.['2010-2015']?.value ?? 0,
          '2015-2021': value.annualEvolution?.['2015-2021']?.value ?? 0,
          epciCode: key,
          name: value.name,
        }
      })

    return `
     <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding: ${topPadding}px ${padding}px ${padding}px ${padding}px;
              background: white;
              font-family: 'Calibri', Arial, sans-serif;
              width: ${scaledWidth}px;
              height: ${scaledHeight}px;
              overflow: hidden;
              box-sizing: border-box;
              display: flex;
              gap: ${padding}px;
            }

            .chart-container {
              flex: 1;
              height: ${chartHeight}px;
              width: ${chartWidth}px;
            }

            #lineChart, #barChart {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>

        <body>
          <div class="chart-container">
            <canvas id="lineChart"></canvas>
          </div>
          <div class="chart-container">
            <canvas id="barChart"></canvas>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script>
            // Line Chart
            const lineCtx = document.getElementById('lineChart')
            const lineDatasets = ${JSON.stringify(lineDatasets)}

            new Chart(lineCtx, {
              type: 'line',
              data: {
                datasets: lineDatasets
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                layout: {
                  padding: {
                    top: 30,
                    right: 10,
                    bottom: 40,
                    left: 10
                  }
                },
                scales: {
                  x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                      display: true,
                      text: '${lineChartTitle}'
                    },
                    grid: {
                      display: true
                    }
                  },
                  y: {
                    min: ${yAxisMin},
                    max: ${yAxisMax},
                    title: {
                      display: true,
                      text: 'Valeur'
                    },
                    grid: {
                      display: true
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top'
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false
                  }
                }
              }
            })

            // Bar Chart
            const barCtx = document.getElementById('barChart')
            const barData = ${JSON.stringify(barChart)}

            new Chart(barCtx, {
              type: 'bar',
              data: {
                labels: barData.map(item => item.name),
                datasets: [
                  {
                    label: '2010-2015',
                    data: barData.map(item => item['2010-2015']),
                    backgroundColor: '${chartKeyColors['2010-2015']}',
                    borderColor: '${chartKeyColors['2010-2015']}',
                    borderWidth: 1
                  },
                  {
                    label: '2015-2021',
                    data: barData.map(item => item['2015-2021']),
                    backgroundColor: '${chartKeyColors['2015-2021']}',
                    borderColor: '${chartKeyColors['2015-2021']}',
                    borderWidth: 1
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                layout: {
                  padding: {
                    top: 30,
                    right: 10,
                    bottom: 40,
                    left: 10
                  }
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: '${barChartTitle}'
                    },
                    ticks: {
                      display: false
                    }
                  },
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Valeur'
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    align: 'end'
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false
                  }
                }
              }
            })
          </script>
        </body>
      </html>
    `
  }

  private generateAnnualNeedsChart(chartConfig: ChartConfig, scale: number = 1): string {
    const width = chartConfig.width || 800
    const height = chartConfig.height || 500
    const scaledWidth = width * scale
    const scaledHeight = height * scale
    const padding = 20 * scale
    const chartHeight = scaledHeight - padding

    const data = chartConfig.data as {
      sitadelData: Array<{ year: number; value: number }>
      newConstructionsData: {
        housingNeeds: Record<number, number>
        surplusHousing: Record<number, number>
      }
      horizon: number
    }

    const { sitadelData, newConstructionsData, horizon } = data

    const allYears = Array.from(
      new Set([
        ...sitadelData.map((d) => d.year),
        ...Object.keys(newConstructionsData.housingNeeds).map(Number),
        ...Object.keys(newConstructionsData.surplusHousing).map(Number),
      ]),
    ).sort((a, b) => a - b)

    const mergedData = allYears.map((year) => ({
      housingNeeds: newConstructionsData.housingNeeds[year] ?? null,
      surplusHousing: newConstructionsData.surplusHousing[year] ?? null,
      sitadelValue: sitadelData.find((d) => d.year === year)?.value ?? null,
      year,
    }))

    const maxValue = Math.max(
      Math.max(...sitadelData.map((d) => d.value)),
      Math.max(...Object.values(newConstructionsData.housingNeeds)),
      Math.max(...Object.values(newConstructionsData.surplusHousing)),
    )

    return `
     <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding: ${padding}px;
              background: white;
              font-family: 'Calibri', Arial, sans-serif;
              width: ${scaledWidth}px;
              height: ${scaledHeight}px;
              overflow: hidden;
              box-sizing: border-box;
            }

            .chart-container {
              height: ${chartHeight}px;
              width: 100%;
            }

            #annualNeedsChart {
              width: 100%;
              height: 100%;
            }

            .chart-title {
              text-align: center;
              font-size: ${16 * scale}px;
              font-weight: bold;
              margin-bottom: ${10 * scale}px;
            }
          </style>
        </head>

        <body>
          <div class="chart-title">Besoins en construction neuves annualisés</div>
          <div class="chart-container">
            <canvas id="annualNeedsChart"></canvas>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script>
            const ctx = document.getElementById('annualNeedsChart')
            const mergedData = ${JSON.stringify(mergedData)}
            const horizon = ${horizon}
            const maxValue = ${maxValue}

            // Create datasets for the chart
            const datasets = [
              {
                label: 'Permis de construire autorisés (Sit@del)',
                data: mergedData.map(item => item.sitadelValue),
                backgroundColor: '${chartKeyColors.sitadelValue}',
                borderColor: '${chartKeyColors.sitadelValue}',
                borderWidth: 1,
                type: 'bar'
              },
              {
                label: 'Besoins en logements',
                data: mergedData.map(item => item.housingNeeds),
                backgroundColor: '${chartKeyColors.housingNeeds}',
                borderColor: '${chartKeyColors.housingNeeds}',
                borderWidth: 1,
                type: 'bar'
              },
              {
                label: 'Logements excédentaires',
                data: mergedData.map(item => item.surplusHousing),
                backgroundColor: '${chartKeyColors.surplusHousing}',
                borderColor: '${chartKeyColors.surplusHousing}',
                borderWidth: 1,
                type: 'bar'
              }
            ]

            new Chart(ctx, {
              type: 'bar',
              data: {
                labels: mergedData.map(item => item.year),
                datasets: datasets
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                layout: {
                  padding: {
                    top: 10,
                    right: 50,
                    bottom: 40,
                    left: 20
                  }
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Année'
                    },
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45
                    }
                  },
                  y: {
                    beginAtZero: true,
                    max: ${Math.ceil(maxValue * 1.1)},
                    title: {
                      display: true,
                      text: 'Nombre de logements'
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top'
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false
                  }
                }
              }
            })
          </script>
        </body>
      </html>
    `
  }

  private generateComparisonHousingNeedsChart(chartConfig: ChartConfig, scale: number = 1): string {
    const width = chartConfig.width || 800
    const height = chartConfig.height || 500
    const scaledWidth = width * scale
    const scaledHeight = height * scale
    const padding = 20 * scale
    const chartHeight = scaledHeight - padding * 2

    const data = chartConfig.data as Record<string, TResults>

    const simulationIds = Object.keys(data)
    const simulationResults = simulationIds.map((id) => ({
      id,
      name: data[id].name,
      flowRequirement: data[id].flowRequirement,
    }))

    const allYears = new Set<number>()
    simulationResults.forEach((sim) => {
      if (sim.flowRequirement?.epcis?.[0]?.data?.housingNeeds) {
        Object.keys(sim.flowRequirement.epcis[0].data.housingNeeds).forEach((year) => {
          allYears.add(parseInt(year))
        })
      }
    })

    const sortedYears = Array.from(allYears).sort((a, b) => a - b)

    const datasets = simulationResults.map((sim, index) => {
      const housingNeedsData = sortedYears.map((year) => {
        const epciData = sim.flowRequirement?.epcis?.[0]
        return epciData?.data?.housingNeeds?.[year] || 0
      })

      const colors = ['#002060', '#DAE3F4', '#FBE5D6']

      return {
        label: sim.name,
        data: housingNeedsData,
        backgroundColor: colors[index],
        borderColor: colors[index],
        borderWidth: 1,
      }
    })

    const allValues = datasets.flatMap((d) => d.data)
    const maxValue = Math.max(...allValues.filter((v) => v > 0))

    return `
     <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding: ${padding}px;
              background: white;
              font-family: 'Calibri', Arial, sans-serif;
              width: ${scaledWidth}px;
              height: ${scaledHeight}px;
              overflow: hidden;
              box-sizing: border-box;
            }

            .chart-container {
              height: ${chartHeight}px;
              width: 100%;
            }

            #comparisonChart {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>

        <body>
          <div class="chart-container">
            <canvas id="comparisonChart"></canvas>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script>
            const ctx = document.getElementById('comparisonChart')
            const datasets = ${JSON.stringify(datasets)}
            const years = ${JSON.stringify(sortedYears)}
            const maxValue = ${maxValue}

            new Chart(ctx, {
              type: 'bar',
              data: {
                labels: years,
                datasets: datasets
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                layout: {
                  padding: {
                    top: 10,
                    right: 20,
                    bottom: 40,
                    left: 20
                  }
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Année'
                    },
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45
                    },
                    categoryPercentage: 0.8,
                    barPercentage: 0.9
                  },
                  y: {
                    beginAtZero: true,
                    max: ${Math.ceil(maxValue * 1.1)},
                    title: {
                      display: true,
                      text: 'Nombre de logements'
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top'
                  }
                }
              }
            })
          </script>
        </body>
      </html>
    `
  }
}
