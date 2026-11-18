import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 移动端判定
 * <p>
 * 用 matchMedia 而不是读 userAgent：支持随窗口尺寸变化实时切换，
 * 也方便在桌面浏览器拉窄窗口时调试移动端样式。
 *
 * @param breakpoint 断点，默认 768px（与 mobile.css 保持一致）
 */
export function useIsMobile(breakpoint = 768) {
  const isMobile = ref(false)
  let mql: MediaQueryList | null = null

  const update = (e: MediaQueryListEvent | MediaQueryList) => {
    isMobile.value = e.matches
  }

  onMounted(() => {
    mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    isMobile.value = mql.matches
    // Safari < 14 只支持 addListener
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', update)
    } else {
      ;(mql as any).addListener(update)
    }
  })

  onUnmounted(() => {
    if (!mql) return
    if (typeof mql.removeEventListener === 'function') {
      mql.removeEventListener('change', update)
    } else {
      ;(mql as any).removeListener(update)
    }
  })

  return { isMobile }
}
