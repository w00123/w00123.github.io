/**
 * Refer to hexo-generator-searchdb
 * https://github.com/next-theme/hexo-generator-searchdb/blob/main/dist/search.js
 * Modified by hexo-theme-butterfly
 */

class LocalSearch {
  constructor ({
    path = '',
    unescape = false,
    top_n_per_article = 1
  }) {
    this.path = path
    this.unescape = unescape
    this.top_n_per_article = top_n_per_article
    this.isfetched = false
    this.datas = null
  }

  getIndexByWord (words, text, caseSensitive = false) {
    const index = []
    const included = new Set()

    if (!caseSensitive) {
      text = text.toLowerCase()
    }
    words.forEach(word => {
      if (this.unescape) {
        const div = document.createElement('div')
        div.innerText = word
        word = div.innerHTML
      }
      const wordLen = word.length
      if (wordLen === 0) return
      let startPosition = 0
      let position = -1
      if (!caseSensitive) {
        word = word.toLowerCase()
      }
      while ((position = text.indexOf(word, startPosition)) > -1) {
        index.push({ position, word })
        included.add(word)
        startPosition = position + wordLen
      }
    })
    // Sort index by position of keyword
    index.sort((left, right) => {
      if (left.position !== right.position) {
        return left.position - right.position
      }
      return right.word.length - left.word.length
    })
    return [index, included]
  }

  // Merge hits into slices
  mergeIntoSlice (start, end, index) {
    let item = index[0]
    let { position, word } = item
    const hits = []
    const count = new Set()
    while (position + word.length <= end && index.length !== 0) {
      count.add(word)
      hits.push({
        position,
        length: word.length
      })
      const wordEnd = position + word.length

      // Move to next position of hit
      index.shift()
      while (index.length !== 0) {
        item = index[0]
        position = item.position
        word = item.word
        if (wordEnd > position) {
          index.shift()
        } else {
          break
        }
      }
    }
    return {
      hits,
      start,
      end,
      count: count.size
    }
  }

  // Highlight title and content
  highlightKeyword (val, slice) {
    let result = ''
    let index = slice.start
    for (const { position, length } of slice.hits) {
      result += val.substring(index, position)
      index = position + length
      result += `<mark class="search-keyword">${val.substr(position, length)}</mark>`
    }
    result += val.substring(index, slice.end)
    return result
  }

  getResultItems (keywords) {
    const resultItems = []
    this.datas.forEach(({ title, content, url }) => {
      // The number of different keywords included in the article.
      const [indexOfTitle, keysOfTitle] = this.getIndexByWord(keywords, title)
      const [indexOfContent, keysOfContent] = this.getIndexByWord(keywords, content)
      const includedCount = new Set([...keysOfTitle, ...keysOfContent]).size

      // Show search results
      const hitCount = indexOfTitle.length + indexOfContent.length
      if (hitCount === 0) return

      const slicesOfTitle = []
      if (indexOfTitle.length !== 0) {
        slicesOfTitle.push(this.mergeIntoSlice(0, title.length, indexOfTitle))
      }

      let slicesOfContent = []
      while (indexOfContent.length !== 0) {
        const item = indexOfContent[0]
        const { position } = item
        // Cut out 120 characters. The maxlength of .search-input is 80.
        const start = Math.max(0, position - 20)
        const end = Math.min(content.length, position + 100)
        slicesOfContent.push(this.mergeIntoSlice(start, end, indexOfContent))
      }

      // Sort slices in content by included keywords' count and hits' count
      slicesOfContent.sort((left, right) => {
        if (left.count !== right.count) {
          return right.count - left.count
        } else if (left.hits.length !== right.hits.length) {
          return right.hits.length - left.hits.length
        }
        return left.start - right.start
      })

      // Select top N slices in content
      const upperBound = parseInt(this.top_n_per_article, 10)
      if (upperBound >= 0) {
        slicesOfContent = slicesOfContent.slice(0, upperBound)
      }

      let resultItem = ''

      url = new URL(url, location.origin)
      url.searchParams.append('highlight', keywords.join(' '))

      if (slicesOfTitle.length !== 0) {
        resultItem += `<div class="local-search-hit-item"><a href="${url.href}"><span class="search-result-title">${this.highlightKeyword(title, slicesOfTitle[0])}</span>`
      } else {
        resultItem += `<div class="local-search-hit-item"><a href="${url.href}"><span class="search-result-title">${title}</span>`
      }

      slicesOfContent.forEach(slice => {
        resultItem += `<p class="search-result">${this.highlightKeyword(content, slice)}...</p></a>`
      })

      resultItem += '</div>'
      resultItems.push({
        item: resultItem,
        id: resultItems.length,
        hitCount,
        includedCount
      })
    })
    return resultItems
  }

  fetchData () {
    const isXml = !this.path.endsWith('json')
    fetch(this.path)
      .then(response => response.text())
      .then(res => {
        // Get the contents from search data
        this.isfetched = true
        this.datas = isXml
          ? [...new DOMParser().parseFromString(res, 'text/xml').querySelectorAll('entry')].map(element => ({
              title: element.querySelector('title').textContent,
              content: element.querySelector('content').textContent,
              url: element.querySelector('url').textContent
            }))
          : JSON.parse(res)
        // Only match articles with non-empty titles
        this.datas = this.datas.filter(data => data.title).map(data => {
          data.title = data.title.trim()
          data.content = data.content ? data.content.trim().replace(/<[^>]+>/g, '') : ''
          data.url = decodeURIComponent(data.url).replace(/\/{2,}/g, '/')
          return data
        })
        // Remove loading animation
        window.dispatchEvent(new Event('search:loaded'))
      })
  }

  // Highlight by wrapping node in mark elements with the given class name
  highlightText (node, slice, className) {
    const val = node.nodeValue
    let index = slice.start
    const children = []
    for (const { position, length } of slice.hits) {
      const text = document.createTextNode(val.substring(index, position))
      index = position + length
      const mark = document.createElement('mark')
      mark.className = className
      mark.appendChild(document.createTextNode(val.substr(position, length)))
      children.push(text, mark)
    }
    node.nodeValue = val.substring(index, slice.end)
    children.forEach(element => {
      node.parentNode.insertBefore(element, node)
    })
  }

  // Highlight the search words provided in the url in the text
  highlightSearchWords (body) {
    const params = new URL(location.href).searchParams.get('highlight')
    const keywords = params ? params.split(' ') : []
    if (!keywords.length || !body) return
    const walk = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null)
    const allNodes = []
    while (walk.nextNode()) {
      if (!walk.currentNode.parentNode.matches('button, select, textarea, .mermaid')) allNodes.push(walk.currentNode)
    }
    allNodes.forEach(node => {
      const [indexOfNode] = this.getIndexByWord(keywords, node.nodeValue)
      if (!indexOfNode.length) return
      const slice = this.mergeIntoSlice(0, node.nodeValue.length, indexOfNode)
      this.highlightText(node, slice, 'search-keyword')
    })
  }
}

window.addEventListener('load', () => {
// Search
  const { path, top_n_per_article, unescape, languages } = GLOBAL_CONFIG.localSearch
  const localSearch = new LocalSearch({
    path,
    top_n_per_article,
    unescape
  })

  const input = document.querySelector('#local-search-input input')
  const statsItem = document.getElementById('local-search-stats-wrap')
  const $loadingStatus = document.getElementById('loading-status')
  const isXml = !path.endsWith('json')

  // ===== State management =====
  const STATE = { CENTERED: 'centered', EXPANDED: 'expanded', CLOSED: 'closed' }
  let currentState = STATE.CLOSED
  let isAnimating = false

  // ===== IME composition flag =====
  let isComposing = false

  const $searchMask = document.getElementById('search-mask')
  const $searchDialog = document.querySelector('#local-search .search-dialog')
  const container = document.getElementById('local-search-results')

  // ===== Search input handler =====
  const inputEventFunction = () => {
    // Auto-expand if currently centered and user is typing
    if (currentState === STATE.CENTERED) {
      // Don't expand during IME composition
      if (isComposing) return
      expandSearch()
    }

    if (!localSearch.isfetched) return
    let searchText = input.value.trim().toLowerCase()
    isXml && (searchText = searchText.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    if (searchText !== '') $loadingStatus.innerHTML = '<i class="fas fa-spinner fa-pulse"></i>'
    else $loadingStatus.textContent = ''
    const doSearch = () => {
    const keywords = searchText.split(/[-\s]+/)
    let resultItems = []
    if (searchText.length > 0) {
    // Perform local searching
      resultItems = localSearch.getResultItems(keywords)
    }
    if (keywords.length === 1 && keywords[0] === '') {
      container.textContent = ''
      statsItem.textContent = ''
    } else if (resultItems.length === 0) {
      container.textContent = ''
      const statsDiv = document.createElement('div')
      statsDiv.className = 'search-result-stats'
      statsDiv.textContent = languages.hits_empty.replace(/\$\{query}/, searchText)
      statsItem.innerHTML = statsDiv.outerHTML
    } else {
      resultItems.sort((left, right) => {
        if (left.includedCount !== right.includedCount) {
          return right.includedCount - left.includedCount
        } else if (left.hitCount !== right.hitCount) {
          return right.hitCount - left.hitCount
        }
        return right.id - left.id
      })

      const stats = languages.hits_stats.replace(/\$\{hits}/, resultItems.length)

      container.innerHTML = `<div class="search-result-list">${resultItems.map(result => result.item).join('')}</div>`
      statsItem.innerHTML = `<hr><div class="search-result-stats">${stats}</div>`
      window.pjax && window.pjax.refresh(container)
    }

    $loadingStatus.textContent = ''
    }

    // Defer search to next frame so the loading spinner can render
    requestAnimationFrame(() => {
      setTimeout(doSearch, 0)
    })
  }


  // ===== IME composition events =====
  input.addEventListener('compositionstart', () => { isComposing = true })
  input.addEventListener('compositionend', () => {
    isComposing = false
    inputEventFunction()
  })
  let loadFlag = false

  // ===== Fix Safari height =====
  const fixSafariHeight = () => {
    if (window.innerWidth < 768) {
      $searchDialog.style.setProperty('--search-height', window.innerHeight + 'px')
    }
  }

  // ===== Expand: centered 鈫?expanded (search box moves to top, results appear) =====
  const expandSearch = () => {
    if (currentState === STATE.EXPANDED) return
    currentState = STATE.EXPANDED
    $searchDialog.classList.remove('is-centered')
    void $searchDialog.offsetHeight
    $searchDialog.classList.add('is-expanded')
    input.focus()
  }

  // ===== Center: expanded 鈫?centered (search box returns to middle, results hide) =====
  const centerSearch = () => {
    if (currentState === STATE.CENTERED) return
    currentState = STATE.CENTERED
    $searchDialog.classList.remove('is-expanded')
    $searchDialog.classList.add('is-centered')
    // Clear results
    container.textContent = ''
    statsItem.textContent = ''
    $loadingStatus.textContent = ''
  }

  // ===== Open: closed 鈫?centered (search box slides from bottom to middle) =====
  const openSearch = () => {
    const bodyStyle = document.body.style
    bodyStyle.width = '100%'
    bodyStyle.overflow = 'hidden'

    // Fade in mask
    $searchMask.style.display = 'block'
    $searchMask.style.opacity = '0'
    void $searchMask.offsetHeight
    $searchMask.style.transition = 'opacity 0.5s'
    $searchMask.style.opacity = '1'

    // Show dialog with header off-screen at bottom
    $searchDialog.style.display = 'block'
    void $searchDialog.offsetHeight
    // Transition header from bottom to center
    $searchDialog.classList.add('is-centered')

    currentState = STATE.CENTERED

    // Focus input after animation completes
    setTimeout(() => { input.focus() }, 600)

    // Register input handler on first open
    if (!loadFlag) {
      !localSearch.isfetched && localSearch.fetchData()
      input.addEventListener('input', inputEventFunction)
      loadFlag = true
    }

    fixSafariHeight()
    window.addEventListener('resize', fixSafariHeight)
  }

  // ===== Close: any state 鈫?closed =====
  const closeSearch = () => {
    if (isAnimating || currentState === STATE.CLOSED) return
    isAnimating = true

    const bodyStyle = document.body.style
    bodyStyle.width = ''
    bodyStyle.overflow = ''

    // Fade out mask
    $searchMask.style.transition = 'opacity 0.3s'
    $searchMask.style.opacity = '0'
    setTimeout(() => {
      $searchMask.style.display = ''
      $searchMask.style.transition = ''
      $searchMask.style.opacity = ''
    }, 300)

    // Animate dialog with fade out
    $searchDialog.style.animation = 'search_close .25s forwards'
    const onEnd = () => {
      if (!isAnimating) return
      isAnimating = false
      $searchDialog.style.display = ''
      $searchDialog.style.animation = ''
      $searchDialog.classList.remove('is-centered', 'is-expanded')
      $searchDialog.removeEventListener('animationend', onEnd)
    }

    // Ensure body overflow is always restored even if animation is interrupted
    const bs = document.body.style
    bs.width = ''
    bs.overflow = ''
    $searchDialog.addEventListener('animationend', onEnd)

    currentState = STATE.CLOSED
    input.value = ''
    container.textContent = ''
    statsItem.textContent = ''
    $loadingStatus.textContent = ''
    window.removeEventListener('resize', fixSafariHeight)
  }

  // ===== Event: click on input 鈫?expand =====
  input.addEventListener('click', () => {
    if (currentState === STATE.CENTERED) expandSearch()
  })

  // ===== Event: click on mask 鈫?state-dependent behavior =====
  $searchMask.addEventListener('click', () => {
    if (currentState === STATE.EXPANDED) {
      // Only go back to center if input is empty
      if (input.value.trim() === '') {
        centerSearch()
      }
      // If input has text, stay expanded (do nothing)
    } else if (currentState === STATE.CENTERED) {
      closeSearch()
    }
  })

  // ===== Event: ESC key =====
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && currentState !== STATE.CLOSED) {
      closeSearch()
    }
  })

  // ===== Event: close button =====
  const $closeBtn = document.getElementById('search-close-btn')
  if ($closeBtn) {
    $closeBtn.addEventListener('click', closeSearch)
  }

  // ===== Search button in nav =====
  const searchClickFn = () => {
    btf.addEventListenerPjax(document.querySelector('#search-button > .search'), 'click', openSearch)
  }

  // ===== Close search on browser back (mobile) =====
  window.addEventListener('popstate', () => {
    if (currentState !== STATE.CLOSED) {
      closeSearch()
    }
  })

  // ===== Init =====
  if (GLOBAL_CONFIG.localSearch.preload) {
    localSearch.fetchData()
  }

  localSearch.highlightSearchWords(document.getElementById('article-container'))
  searchClickFn()

  // ===== search:loaded event =====
  window.addEventListener('search:loaded', () => {
    const $loadDataItem = document.getElementById('loading-database')
    $loadDataItem.nextElementSibling.style.display = 'block'
    $loadDataItem.remove()
  })

  // ===== Pjax =====
  window.addEventListener('pjax:complete', () => {
    !btf.isHidden($searchMask) && closeSearch()
    localSearch.highlightSearchWords(document.getElementById('article-container'))
    searchClickFn()
  })
})
