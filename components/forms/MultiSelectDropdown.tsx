import { Fragment } from 'react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { Popover, Transition } from '@headlessui/react'
import Checkbox from './Checkbox'

const MultiSelectDropdown = ({
  options,
  selected,
  toggleOption,
}: {
  options: string[]
  selected: string[]
  toggleOption: (x: string) => void
}) => {
  const { t } = useTranslation('common')
  return (
    <Popover className="relative w-full min-w-[120px]">
      {({ open }) => (
        <div className="flex flex-col">
          <Popover.Button
            className={`default-transition h-12 rounded-md bg-th-bkg-1 px-3 text-th-fgd-1 ring-1 ring-inset ring-th-bkg-4 hover:ring-th-fgd-4  ${
              open ? 'ring-th-fgd-4' : 'ring-th-bkg-4'
            }`}
          >
            <div className={`flex items-center justify-between`}>
              {selected.length ? (
                <span>{selected.toString().replace(/,/g, ', ')}</span>
              ) : (
                <span className="text-th-fgd-4">
                  {t('activity:select-tokens')}
                </span>
              )}
              <ChevronDownIcon
                className={`default-transition ml-0.5 h-6 w-6 ${
                  open ? 'rotate-180 transform' : 'rotate-360 transform'
                }`}
                aria-hidden="true"
              />
            </div>
          </Popover.Button>
          <Transition
            appear={true}
            show={open}
            as={Fragment}
            enter="transition-all ease-in duration-200"
            enterFrom="opacity-0 transform scale-75"
            enterTo="opacity-100 transform scale-100"
            leave="transition ease-out duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Popover.Panel className="absolute top-14 z-10 h-72 w-full overflow-y-auto">
              <div className="relative space-y-2.5 rounded-md bg-th-bkg-3 p-3">
                {options.map((option: string) => {
                  const isSelected = selected.includes(option)
                  return (
                    <Checkbox
                      labelClass="text-sm"
                      checked={isSelected}
                      key={option}
                      onChange={() => toggleOption(option)}
                    >
                      {option}
                    </Checkbox>
                  )
                })}
              </div>
            </Popover.Panel>
          </Transition>
        </div>
      )}
    </Popover>
  );
}

export default MultiSelectDropdown
