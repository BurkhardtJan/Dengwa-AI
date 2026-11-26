import {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {defaultLabels, type MiniMediLabels} from 'minimedi'

/**
 * MiniMedi's texts in the current UI language (src/locales/<lang>/minimedi.json).
 * The keys come from MiniMedi's own defaultLabels, so a key missing from a locale
 * file falls back to MiniMedi's English text instead of showing the key.
 */
export function useMiniMediLabels(): MiniMediLabels {
    const {t} = useTranslation('minimedi')
    return useMemo(() => {
        const keys = Object.keys(defaultLabels) as (keyof MiniMediLabels)[]
        return Object.fromEntries(
            keys.map(key => [key, t(key, {defaultValue: defaultLabels[key]})])
        ) as unknown as MiniMediLabels
    }, [t])
}
