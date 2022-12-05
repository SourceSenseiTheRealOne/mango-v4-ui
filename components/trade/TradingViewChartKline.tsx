import { useEffect, useRef, useState } from 'react'
import mangoStore from '@store/mangoStore'
import { CHART_DATA_FEED } from 'utils/constants'
import klinecharts, { init, dispose } from 'klinecharts'
import axios from 'axios'
import { useViewport } from 'hooks/useViewport'
import usePrevious from '@components/shared/usePrevious'
import Modal from '@components/shared/Modal'
import Switch from '@components/forms/Switch'
import {
  BASE_CHART_QUERY,
  CHART_QUERY,
  DEFAULT_SUB_INDICATOR,
  HISTORY,
  mainTechnicalIndicatorTypes,
  MAIN_INDICATOR_CLASS,
  ONE_DAY_SECONDS,
  RES_NAME_TO_RES_VAL,
  subTechnicalIndicatorTypes,
} from 'utils/kLineChart'
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline'

const TradingViewChartKline = () => {
  const { width } = useViewport()
  const prevWidth = usePrevious(width)
  const selectedMarketName = mangoStore((s) => s.selectedMarket.current?.name)
  const [isTechnicalModalOpen, setIsTechnicalModalOpen] = useState(false)
  const [mainTechnicalIndicators, setMainTechnicalIndicators] = useState<
    string[]
  >([])
  const [subTechnicalIndicators, setSubTechnicalIndicators] = useState<{
    //indicatorName: class
    [indicatorName: string]: string
  }>({})
  const [resolution, setResultion] = useState(RES_NAME_TO_RES_VAL['1H'])
  const [chart, setChart] = useState<klinecharts.Chart | null>(null)
  const [baseChartQuery, setQuery] = useState<BASE_CHART_QUERY | null>(null)
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fetchData = async (baseQuery: BASE_CHART_QUERY, from: number) => {
    try {
      const query: CHART_QUERY = {
        ...baseQuery,
        from,
      }
      const response = await axios.get(`${CHART_DATA_FEED}/history`, {
        params: query,
      })
      const newData = response.data as HISTORY
      const dataSize = newData.t.length
      const dataList = []
      for (let i = 0; i < dataSize; i++) {
        const kLineModel = {
          open: parseFloat(newData.o[i]),
          low: parseFloat(newData.l[i]),
          high: parseFloat(newData.h[i]),
          close: parseFloat(newData.c[i]),
          volume: parseFloat(newData.v[i]),
          timestamp: newData.t[i] * 1000,
        }
        dataList.push(kLineModel)
      }
      return dataList
    } catch (e) {
      console.log(e)
      return []
    }
  }

  function updateData(
    kLineChart: klinecharts.Chart,
    baseQuery: BASE_CHART_QUERY
  ) {
    if (clearTimerRef.current) {
      clearInterval(clearTimerRef.current)
    }
    clearTimerRef.current = setTimeout(async () => {
      if (kLineChart) {
        const from = baseQuery.to - resolution.seconds
        const newData = (await fetchData(baseQuery!, from))[0]
        if (newData) {
          newData.timestamp += 10000
          kLineChart.updateData(newData)
          updateData(kLineChart, baseQuery)
        }
      }
    }, 10000)
  }
  const fetchFreshData = async (daysToSubtractFromToday: number) => {
    const from =
      Math.floor(Date.now() / 1000) - ONE_DAY_SECONDS * daysToSubtractFromToday
    const data = await fetchData(baseChartQuery!, from)
    if (chart) {
      chart.applyNewData(data)
      //after we fetch fresh data start to update data every x seconds
      updateData(chart, baseChartQuery!)
    }
  }

  useEffect(() => {
    if (width !== prevWidth && chart) {
      //wait for event que to be empty
      //to have current width
      setTimeout(() => {
        chart?.resize()
      }, 0)
    }
  }, [width])

  //when base query change we refetch fresh data
  useEffect(() => {
    if (chart && baseChartQuery) {
      fetchFreshData(14)
      //add callback to fetch more data when zoom out
      chart.loadMore(() => {
        fetchFreshData(365)
      })
    }
  }, [baseChartQuery])

  //change query based on market and resolution
  useEffect(() => {
    if (selectedMarketName && resolution) {
      setQuery({
        resolution: resolution.val,
        symbol: selectedMarketName,
        to: Math.floor(Date.now() / 1000),
      })
    }
  }, [selectedMarketName, resolution])

  //init chart without data
  useEffect(() => {
    const initKline = async () => {
      const style = getComputedStyle(document.body)
      const gridColor = style.getPropertyValue('--bkg-3')
      const kLineChart = init('update-k-line')
      kLineChart.setStyleOptions({
        grid: {
          show: true,
          horizontal: {
            style: 'solid',
            color: gridColor,
          },
          vertical: {
            style: 'solid',
            color: gridColor,
          },
        },
        candle: {
          tooltip: {
            labels: ['T: ', 'O: ', 'C: ', 'H: ', 'L: ', 'V: '],
          },
        },
        xAxis: {
          axisLine: {
            show: true,
            color: gridColor,
            size: 1,
          },
        },
        yAxis: {
          axisLine: {
            show: true,
            color: gridColor,
            size: 1,
          },
        },
        separator: {
          size: 2,
          color: gridColor,
        },
      })
      setChart(kLineChart)
    }
    initKline()
    return () => {
      dispose('update-k-line')
    }
  }, [])
  useEffect(() => {
    if (chart !== null && DEFAULT_SUB_INDICATOR) {
      const subId = chart.createTechnicalIndicator(DEFAULT_SUB_INDICATOR, true)
      setSubTechnicalIndicators({ [DEFAULT_SUB_INDICATOR]: subId })
    }
  }, [chart !== null])
  return (
    <div className="fixed h-full w-full">
      <div className="flex w-full">
        {Object.keys(RES_NAME_TO_RES_VAL).map((key) => (
          <div
            className={`cursor-pointer py-1 px-2 ${
              resolution === RES_NAME_TO_RES_VAL[key] ? 'text-th-active' : ''
            }`}
            key={key}
            onClick={() => setResultion(RES_NAME_TO_RES_VAL[key])}
          >
            {key}
          </div>
        ))}
        <div
          className="cursor-pointer py-1 px-2 "
          onClick={() => setIsTechnicalModalOpen(true)}
        >
          Indicator
        </div>
        <div className="py-1 px-2">
          <ArrowsPointingOutIcon className="w-5"></ArrowsPointingOutIcon>
        </div>
      </div>
      <div
        style={{ height: 'calc(100% - 30px)', width: '100%' }}
        id="update-k-line"
        className="k-line-chart"
      />
      <Modal
        isOpen={isTechnicalModalOpen}
        onClose={() => setIsTechnicalModalOpen(false)}
      >
        <div className="flex max-h-96 flex-col overflow-auto text-left">
          <h2 className="py-4">Main Indicator</h2>
          {mainTechnicalIndicatorTypes.map((type) => {
            return (
              <IndicatorSwitch
                key={type}
                type={type}
                checked={!!mainTechnicalIndicators.find((x) => x === type)}
                onChange={(check) => {
                  if (check) {
                    chart?.createTechnicalIndicator(type, true, {
                      id: MAIN_INDICATOR_CLASS,
                    })
                    setMainTechnicalIndicators([
                      ...mainTechnicalIndicators,
                      type,
                    ])
                  } else {
                    chart?.removeTechnicalIndicator(MAIN_INDICATOR_CLASS, type)
                    setMainTechnicalIndicators([
                      ...mainTechnicalIndicators.filter((x) => x !== type),
                    ])
                  }
                }}
              ></IndicatorSwitch>
            )
          })}
          <h2 className="py-4">Sub Indicator</h2>
          {subTechnicalIndicatorTypes.map((type) => {
            return (
              <IndicatorSwitch
                key={type}
                type={type}
                checked={
                  !!Object.keys(subTechnicalIndicators).find((x) => x === type)
                }
                onChange={(check) => {
                  if (check) {
                    const subId = chart?.createTechnicalIndicator(type, true)
                    setSubTechnicalIndicators({
                      ...subTechnicalIndicators,
                      [type]: subId!,
                    })
                  } else {
                    chart?.removeTechnicalIndicator(
                      subTechnicalIndicators[type],
                      type
                    )
                    const newItems = { ...subTechnicalIndicators }
                    delete newItems[type] // or whichever key you want
                    setSubTechnicalIndicators(newItems)
                  }
                }}
              ></IndicatorSwitch>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}

const IndicatorSwitch = ({
  type,
  onChange,
  checked,
}: {
  type: string
  onChange: (checked: boolean) => void
  checked: boolean
}) => {
  return (
    <div
      className="flex justify-between border-t border-th-bkg-3 p-4 text-th-fgd-4"
      key={type}
    >
      {type}
      <Switch checked={checked} onChange={onChange} />
    </div>
  )
}

export default TradingViewChartKline
