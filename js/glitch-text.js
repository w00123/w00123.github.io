/**
 * Glitch Text - 增强版故障乱码效果
 * 在原有 CSS glitch 偏移/抖动基础上，增加文字突然碎成乱码然后恢复的动画
 * 适用于 #site-title（首页标题）和 #post-info .post-title（文章标题）
 */
(function () {
  'use strict'

  // ---- 获取所有目标元素 ----
  const elements = [
    document.getElementById('site-title'),
    document.querySelector('#post-info .post-title'),
  ].filter(Boolean)

  if (elements.length === 0) return

  // ---- 乱码字符池 ----
  const GLITCH_CHARS = [
    'ﾊ','ﾋ','ﾌ','ﾍ','ﾎ','ﾏ','ﾐ','ﾑ','ﾒ','ﾓ',
    'ﾔ','ﾕ','ﾖ','ﾗ','ﾘ','ﾙ','ﾚ','ﾛ','ﾜ','ﾝ',
    'ｦ','ｧ','ｨ','ｩ','ｪ','ｫ','ｬ','ｭ','ｮ','ｯ',
    'ｰ','ｱ','ｲ','ｳ','ｴ','ｵ','ﾟ','ﾞ',
    '░','▒','▓','█','▄','▀','■','□','▪','▫',
    '▲','△','▼','▽','◆','◇','○','●','◎','◉',
    '龘','龗','龞','龡','龢','龣','龤','龥',
    '爨','灥','馫','飍','厵',
    '∅','∆','∇','∈','∏','∑','√','∞','∟','∩',
    '∫','≈','≠','≡','≤','≥','⊂','⊃','⊆',
    '╔','╗','╚','╝','║','═','╠','╣','╦','╩','╬',
    '┌','┐','└','┘','├','┤','┬','┴','┼',
    'Я','Ж','Ц','Ч','Ш','Щ','Ъ','Ы','Ь','Э','Ю',
    'ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي',
    '￥','¨','£','§','¤','¢','€','¿','‽','⁈','⁇',
    '†','‡','•','‥','…','′','″','‾','⁄',
  ]

  function randomGlitchChar () {
    return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
  }

  /**
   * 将文本按指定强度打乱为乱码
   */
  function garbleText (text, intensity, segmentRatio) {
    const chars = text.split('')
    const positions = chars
      .map((ch, i) => ({ ch, i }))
      .filter(({ ch }) => ch !== ' ')
      .map(({ i }) => i)

    if (positions.length === 0) return text

    let targetCount = Math.floor(positions.length * intensity)
    targetCount = Math.max(1, Math.min(targetCount, positions.length))

    const selected = new Set()
    if (segmentRatio && segmentRatio > 0 && segmentRatio < 1) {
      const segmentLen = Math.floor(positions.length * segmentRatio)
      const startIdx = Math.floor(Math.random() * (positions.length - segmentLen))
      const segmentPositions = positions.slice(startIdx, startIdx + segmentLen)
      const shuffled = segmentPositions.sort(() => Math.random() - 0.5)
      for (let i = 0; i < Math.min(targetCount, shuffled.length); i++) {
        selected.add(shuffled[i])
      }
      if (selected.size < targetCount) {
        const remaining = positions.filter(p => !selected.has(p))
        const extra = remaining.sort(() => Math.random() - 0.5)
        for (let i = 0; selected.size < targetCount && i < extra.length; i++) {
          selected.add(extra[i])
        }
      }
    } else {
      const shuffled = positions.sort(() => Math.random() - 0.5)
      for (let i = 0; i < targetCount; i++) {
        selected.add(shuffled[i])
      }
    }

    return chars.map((ch, i) => {
      if (ch === ' ') return ch
      return selected.has(i) ? randomGlitchChar() : ch
    }).join('')
  }

  /**
   * 安全替换元素的文本内容，保留子元素（如编辑链接）不受影响
   * @param {Element} el
   * @param {string} newText
   */
  function replaceTextSafe (el, newText) {
    const textNodes = []
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node)
      }
    }
    if (textNodes.length === 0) return
    // 合并所有文本节点为第一个，其余清空
    textNodes[0].textContent = newText
    for (let i = 1; i < textNodes.length; i++) {
      textNodes[i].textContent = ''
    }
  }

  /** 各元素各自的乱码锁，互不干扰 */
  const glitchLocks = new WeakMap()

  /**
   * 触发一次乱码爆发（单个元素）
   */
  function triggerGlitchBurst (el) {
    if (glitchLocks.get(el)) return
    glitchLocks.set(el, true)

    // 检查是否有子元素（文章标题可能有编辑链接）
    const hasChildElements = Array.from(el.childNodes).some(n => n.nodeType === Node.ELEMENT_NODE)
    const originalText = el.textContent
    const originalHTML = hasChildElements ? el.innerHTML : null

    const frameCount = 2 + Math.floor(Math.random() * 4)
    const frameInterval = 30 + Math.random() * 30

    let frame = 0
    const burstStyle = Math.random()
    const segmentation = burstStyle < 0.4 ? 0 : (0.3 + Math.random() * 0.4)

    const timer = setInterval(() => {
      if (frame >= frameCount) {
        clearInterval(timer)
        // ---- 完全恢复 ----
        if (hasChildElements) {
          el.innerHTML = originalHTML
        } else {
          el.textContent = originalText
        }
        el.setAttribute('data-text', originalText)
        el.classList.remove('glitch-garbled')
        glitchLocks.set(el, false)
        return
      }

      // 计算当前帧的乱码强度
      let intensity
      const progress = frame / frameCount
      if (burstStyle < 0.6) {
        intensity = 0.25 + (1 - progress) * 0.2
        if (frame === 0) intensity = 0.35 + Math.random() * 0.15
      } else {
        intensity = Math.sin(progress * Math.PI) * 0.3 + 0.1
      }
      intensity = Math.min(1, Math.max(0, intensity))
      intensity += (Math.random() - 0.5) * 0.08
      intensity = Math.min(1, Math.max(0.05, intensity))

      const garbled = garbleText(originalText, intensity, segmentation)
      // 安全替换文本，不破坏子元素
      replaceTextSafe(el, garbled)
      el.setAttribute('data-text', garbled)
      el.classList.add('glitch-garbled')

      frame++
    }, frameInterval)
  }

  /**
   * 为单个元素调度乱码爆发
   */
  function scheduleForElement (el, initialDelay) {
    setTimeout(() => {
      triggerGlitchBurst(el)
      function scheduleNext () {
        const delay = 2000 + Math.random() * 6000
        setTimeout(() => {
          triggerGlitchBurst(el)
          scheduleNext()
        }, delay)
      }
      scheduleNext()
    }, initialDelay)
  }

  // ---- 启动每个元素 ----
  let delay = 1000
  elements.forEach((el) => {
    scheduleForElement(el, delay)
    delay += 600 // 错开触发时间
  })
})()
