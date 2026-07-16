import { useEffect, useRef, useState } from 'react'

interface ScrollMetrics {
  top: number
  height: number
  scrollable: boolean
}

export function FloatingScrollbar() {
  const [visible, setVisible] = useState(false)
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    top: 0,
    height: 44,
    scrollable: false,
  })
  const drag = useRef<{
    pointerY: number
    scrollY: number
    maxScroll: number
    thumbTravel: number
  } | null>(null)

  useEffect(() => {
    const update = () => {
      const root = document.documentElement
      const viewport = window.innerHeight
      const content = Math.max(root.scrollHeight, document.body.scrollHeight)
      const track = Math.max(0, viewport - 8)
      const maxScroll = Math.max(0, content - viewport)
      const height = Math.min(
        track,
        Math.max(44, content ? (viewport / content) * track : track),
      )
      const travel = Math.max(0, track - height)
      setMetrics({
        height,
        top: maxScroll ? (window.scrollY / maxScroll) * travel : 0,
        scrollable: maxScroll > 1,
      })
    }
    const show = () => setVisible(true)
    const hide = () => {
      if (!drag.current) setVisible(false)
    }

    update()
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(document.body)
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    document.documentElement.addEventListener('pointerenter', show)
    document.documentElement.addEventListener('pointerleave', hide)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      document.documentElement.removeEventListener('pointerenter', show)
      document.documentElement.removeEventListener('pointerleave', hide)
    }
  }, [])

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = window.innerHeight
    const content = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
    )
    drag.current = {
      pointerY: event.clientY,
      scrollY: window.scrollY,
      maxScroll: Math.max(0, content - viewport),
      thumbTravel: Math.max(1, viewport - 8 - metrics.height),
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    const delta = event.clientY - drag.current.pointerY
    window.scrollTo(
      0,
      drag.current.scrollY +
        (delta / drag.current.thumbTravel) * drag.current.maxScroll,
    )
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    drag.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  if (!metrics.scrollable) return null

  return (
    <div
      className={`floating-scrollbar ${visible ? 'visible' : ''}`}
      aria-hidden="true"
    >
      <div
        className="floating-scrollbar-thumb"
        style={{ top: metrics.top, height: metrics.height }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
    </div>
  )
}
