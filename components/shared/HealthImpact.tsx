import { HealthType } from '@blockworks-foundation/mango-v4'
import { ArrowRightIcon } from '@heroicons/react/20/solid'
import { PublicKey } from '@solana/web3.js'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import mangoStore from '@store/mangoStore'

const HealthImpact = ({
  uiAmount,
  isDeposit,
  mintPk,
}: {
  uiAmount: number
  isDeposit?: boolean
  mintPk: PublicKey
}) => {
  const { t } = useTranslation('common')
  const group = mangoStore.getState().group
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)

  const currentMaintHealth = useMemo(() => {
    if (!group || !mangoAccount) return 0
    return mangoAccount.getHealthRatioUi(group, HealthType.maint)
  }, [mangoAccount])

  const maintProjectedHealth = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !mangoAccount) return 0
    const uiTokenAmount = isDeposit ? uiAmount : uiAmount * -1
    const projectedHealth =
      mangoAccount.simHealthRatioWithTokenPositionUiChanges(
        group,
        [{ mintPk, uiTokenAmount }],
        HealthType.maint
      )

    return projectedHealth! > 100
      ? 100
      : projectedHealth! < 0
      ? 0
      : Math.trunc(projectedHealth!)
  }, [mangoAccount, mintPk, uiAmount, isDeposit])

  return (
    <div className="flex justify-between">
      <p>{t('health-impact')}</p>
      <div className="flex items-center space-x-2 font-mono">
        <p className="text-th-fgd-1">{currentMaintHealth}%</p>
        <ArrowRightIcon className="h-4 w-4 text-th-fgd-4" />
        <p
          className={
            maintProjectedHealth < 50 && maintProjectedHealth > 15
              ? 'text-th-orange'
              : maintProjectedHealth <= 15
              ? 'text-th-red'
              : 'text-th-green'
          }
        >
          {maintProjectedHealth}%{' '}
          <span
            className={`text-xs ${
              maintProjectedHealth >= currentMaintHealth!
                ? 'text-th-green'
                : 'text-th-red'
            }`}
          >
            ({maintProjectedHealth >= currentMaintHealth! ? '+' : ''}
            {maintProjectedHealth - currentMaintHealth!}%)
          </span>
        </p>
      </div>
    </div>
  )
}

export default HealthImpact
