import Sun from 'components/Icons/Sun'
import { Flex } from 'components/layout/Flex'
import { Text } from 'components/Text/Text'
import { atom, useAtom } from 'jotai'
import { atomWithStorage, useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useCallback, useEffect, useMemo } from 'react'
import styled from 'styled-components/macro'
import { SegmentedControl } from './SegmentedControl'

const THEME_UPDATE_DELAY = 10000
const DARKMODE_MEDIA_QUERY = window.matchMedia('(prefers-color-scheme: dark)')

export enum ThemeMode {
  LIGHT,
  DARK,
  AUTO,
}

const CompactOptionPill = styled(Flex)`
  px: '$padding8',
  height: '$spacing28',
  justifyContent: 'center',
  alignItems: 'center',
`

const OptionPill = styled(Flex)`
  py: '$padding6',
  px: '$padding10',
  row: true,
  justifyContent: 'center',
  alignItems: 'center',
`

// Tracks the device theme
const systemThemeAtom = atom<ThemeMode.LIGHT | ThemeMode.DARK>(
  DARKMODE_MEDIA_QUERY.matches ? ThemeMode.DARK : ThemeMode.LIGHT
)

// Tracks the user's selected theme mode
const themeModeAtom = atomWithStorage<ThemeMode>('interface_color_theme', ThemeMode.DARK)

export function SystemThemeUpdater() {
  const setSystemTheme = useUpdateAtom(systemThemeAtom)

  useEffect(() => {
    DARKMODE_MEDIA_QUERY.addEventListener('change', (event) => {
      setSystemTheme(event.matches ? ThemeMode.DARK : ThemeMode.LIGHT)
    })
  }, [setSystemTheme])

  return null
}

export function useIsDarkMode(): boolean {
  const mode = useAtomValue(themeModeAtom)
  const systemTheme = useAtomValue(systemThemeAtom)

  return (mode === ThemeMode.AUTO ? systemTheme : mode) === ThemeMode.DARK
}

export function useDarkModeManager(): [boolean, (mode: ThemeMode) => void] {
  const isDarkMode = useIsDarkMode()
  const setMode = useUpdateAtom(themeModeAtom)

  return useMemo(() => {
    return [isDarkMode, setMode]
  }, [isDarkMode, setMode])
}

export function ThemeSelector({
  disabled,
  compact = false,
  fullWidth = false,
}: {
  disabled?: boolean
  compact?: boolean
  fullWidth?: boolean
}) {
  const [mode, setMode] = useAtom(themeModeAtom)
  const switchMode = useCallback(
    (value: string | number) => {
      // Switch feels less jittery with short delay
      !disabled && setTimeout(() => setMode(Number(value) as ThemeMode), THEME_UPDATE_DELAY)
    },
    [disabled, setMode],
  )

  const defaultOptions = [
    {
      value: String(ThemeMode.AUTO),
      display: (
        <OptionPill data-testid="theme-auto">
          <Text variant="buttonLabel3">Auto</Text>
        </OptionPill>
      ),
    },
    {
      value: String(ThemeMode.LIGHT),
      display: (
        <OptionPill data-testid="theme-light">
          <Sun />
        </OptionPill>
      ),
    },
  ]

  return (
    <Flex width={fullWidth ? '100%' : 'fit'}>
      <SegmentedControl
        fullWidth={fullWidth}
        options={defaultOptions}
        selectedOption={String(mode)}
        onSelectOption={switchMode}
        size="large"
      />
    </Flex>
  )
}

export default function ThemeToggle({ disabled }: { disabled?: boolean }) {
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Flex row width="40%">
        <Text variant="body3" color="$neutral1">
          Theme
        </Text>
      </Flex>
      <ThemeSelector disabled={disabled} />
    </Flex>
  )
}
