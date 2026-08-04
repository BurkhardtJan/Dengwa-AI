import {useTranslation} from 'react-i18next'
import type {TFunction} from 'i18next'
import {useSpeechSettings} from '@/context/SpeechSettingsContext'
import type {SttEngineId, TtsEngineId} from '@/lib/speech/types'
import {getSttEngine, getTtsEngine} from '@/lib/speech/registry'

const TTS_OPTIONS: TtsEngineId[] = ['browser', 'webgpu', 'server']
const STT_OPTIONS: SttEngineId[] = ['browser', 'webgpu', 'server']

function EngineSwitch<T extends string>({
                                            options, selected, onSelect, isSupported, t,
                                        }: {
    options: T[]
    selected: T
    onSelect: (option: T) => void
    isSupported: (option: T) => boolean
    t: TFunction<'settings'>
}) {
    return (
        <div className="flex gap-1.5">
            {options.map(option => {
                const supported = isSupported(option)
                return (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onSelect(option)}
                        disabled={!supported}
                        title={supported ? undefined : t('notAvailable')}
                        className={`text-xs px-2.5 py-1 rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            selected === option
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {t(`engines.${option}`)}
                    </button>
                )
            })}
        </div>
    )
}

export default function SettingsPage() {
    const {t} = useTranslation('settings')
    const {ttsEngine, setTtsEngine, sttEngine, setSttEngine} = useSpeechSettings()

    return (
        <div className="max-w-xl mx-auto p-6 flex flex-col gap-8">
            <h1 className="text-xl font-semibold">{t('title')}</h1>

            <section className="flex flex-col gap-2">
                <h2 className="text-sm font-medium">{t('tts.title')}</h2>
                <p className="text-xs text-muted-foreground">{t('tts.description')}</p>
                <EngineSwitch
                    options={TTS_OPTIONS}
                    selected={ttsEngine}
                    onSelect={setTtsEngine}
                    isSupported={option => getTtsEngine(option).isSupported()}
                    t={t}
                />
                {ttsEngine === 'browser' && (
                    <p className="text-[11px] text-muted-foreground italic">{t('tts.browserHint')}</p>
                )}
                {ttsEngine === 'webgpu' && (
                    <p className="text-[11px] text-muted-foreground italic">{t('tts.webgpuHint')}</p>
                )}
            </section>

            <section className="flex flex-col gap-2">
                <h2 className="text-sm font-medium">{t('stt.title')}</h2>
                <p className="text-xs text-muted-foreground">{t('stt.description')}</p>
                <EngineSwitch
                    options={STT_OPTIONS}
                    selected={sttEngine}
                    onSelect={setSttEngine}
                    isSupported={option => getSttEngine(option).isSupported()}
                    t={t}
                />
                {sttEngine === 'browser' && (
                    <p className="text-[11px] text-muted-foreground italic">{t('stt.browserPrivacyHint')}</p>
                )}
            </section>
        </div>
    )
}