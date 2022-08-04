<template>
  <div>
    <textarea ref="textarea" />
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { marked } from 'marked'
import CodeMirror from 'codemirror'

import 'codemirror/addon/display/fullscreen'
import 'codemirror/addon/display/placeholder'
import 'codemirror/addon/edit/continuelist'
import 'codemirror/addon/mode/overlay'
import 'codemirror/addon/selection/mark-selection'
import 'codemirror/mode/gfm/gfm'
import 'codemirror/mode/markdown/markdown'
import 'codemirror/mode/xml/xml'

import { isLocalStorageAvailable, isMac } from '../utils/common'

const autosaveKey = 'mdslides_draft'
const autosaveDelay = 10000
const defaultUrl = 'http://'
let toolbarElements: Record<string, HTMLElement> = {}
let bodyOverflow = ''

const markedOptions = {
  breaks: true,
  gfm: true,
}

const blockStyles = {
  bold: '**',
  italic: '*',
  strikethrough: '~~',
}

const insertionTemplates = {
  link: ['[', '](#url#)'],
  image: ['![](', '#url#)'],
  table: [
    '',
    '\n\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Text     | Text     | Text     |\n\n',
  ],
  horizontalRule: ['', '\n\n---\n\n'],
}

const shortcuts = isMac
  ? {
      cleanBlock: 'Cmd-E',
      insertImage: 'Cmd-Alt-I',
      insertLink: 'Cmd-K',
      toggleBlockquote: "Cmd-'",
      toggleBold: 'Cmd-B',
      toggleHeading: 'Cmd-H',
      toggleItalic: 'Cmd-I',
      toggleOrderedList: 'Cmd-Alt-L',
      toggleUnorderedList: 'Cmd-L',
    }
  : {
      cleanBlock: 'Ctrl-E',
      insertImage: 'Ctrl-Alt-I',
      insertLink: 'Ctrl-K',
      toggleBlockquote: "Ctrl-'",
      toggleBold: 'Ctrl-B',
      toggleHeading: 'Ctrl-H',
      toggleItalic: 'Ctrl-I',
      toggleOrderedList: 'Ctrl-Alt-L',
      toggleUnorderedList: 'Ctrl-L',
    }

const getAutosavedValue = () => {
  const value = localStorage.getItem(autosaveKey)
  return typeof value == 'string' && value !== '' ? value : null
}

const createIcon = (options: {
  title: string
  shortcut?: string
  className: string
}) => {
  const el = document.createElement('a')
  el.tabIndex = -1
  el.className = options.className

  el.title = options.shortcut
    ? `${options.title} (${options.shortcut})`
    : options.title

  if (isMac) {
    el.title = el.title.replace('Cmd', '⌘')
    el.title = el.title.replace('Alt', '⌥')
  }

  return el
}

const createSeparator = () => {
  const el = document.createElement('i')
  el.className = 'separator'
  el.innerHTML = '|'
  return el
}

const getCursorTokens = (codeMirror: CodeMirror.Editor) => {
  const position = codeMirror.getCursor('start')
  const token = codeMirror.getTokenAt(position)
  const tokens: Record<string, boolean> = {}

  if (!token.type) {
    return tokens
  }

  for (const type of token.type.split(' ')) {
    switch (type) {
      case 'atom':
        tokens.quote = true
        break
      case 'comment':
        tokens.code = true
        break
      case 'em':
        tokens.italic = true
        break
      case 'header':
      case 'header-1':
      case 'header-2':
      case 'header-3':
      case 'header-4':
      case 'header-5':
      case 'header-6':
        tokens[type.replace('header', 'heading')] = true
        break
      case 'link':
        tokens.link = true
        break
      case 'quote':
        tokens.quote = true
        break
      case 'strikethrough':
        tokens.strikethrough = true
        break
      case 'strong':
        tokens.bold = true
        break
      case 'tag':
        tokens.image = true
        break
      case 'variable-2':
        if (/^\s*\d+\.\s/.test(codeMirror.getLine(position.line))) {
          tokens['ordered-list'] = true
        } else {
          tokens['unordered-list'] = true
        }
        break
    }
  }

  return tokens
}

const toggleFullScreen = (codeMirror: CodeMirror.Editor) => {
  codeMirror.setOption('fullScreen', !codeMirror.getOption('fullScreen'))

  // Prevent scrolling on body during fullscreen active
  if (codeMirror.getOption('fullScreen')) {
    bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = bodyOverflow
  }

  const codeMirrorEl = codeMirror.getWrapperElement()
  codeMirrorEl.previousElementSibling?.classList.toggle('fullscreen')

  const toolbarButton = toolbarElements.fullscreen
  toolbarButton.classList.toggle('active')

  const sideBySide = codeMirrorEl.nextElementSibling
  if (sideBySide?.classList.contains('editor-preview-active-side')) {
    toggleSideBySide(codeMirror)
  }
}

const toggleBold = (codeMirror: CodeMirror.Editor) => {
  _toggleBlock(codeMirror, 'bold', blockStyles.bold)
}

const toggleItalic = (codeMirror: CodeMirror.Editor) => {
  _toggleBlock(codeMirror, 'italic', blockStyles.italic)
}

const toggleStrikethrough = (codeMirror: CodeMirror.Editor) => {
  _toggleBlock(codeMirror, 'strikethrough', blockStyles.strikethrough)
}

const toggleBlockquote = (codeMirror: CodeMirror.Editor) => {
  _toggleLine(codeMirror, 'quote')
}

const toggleHeading = (codeMirror: CodeMirror.Editor) => {
  _toggleHeading(codeMirror)
}

const toggleUnorderedList = (codeMirror: CodeMirror.Editor) => {
  _toggleLine(codeMirror, 'unordered-list')
}

const toggleOrderedList = (codeMirror: CodeMirror.Editor) => {
  _toggleLine(codeMirror, 'ordered-list')
}

const cleanBlock = (codeMirror: CodeMirror.Editor) => {
  _cleanBlock(codeMirror)
}

const insertLink = (codeMirror: CodeMirror.Editor) => {
  const cursorTokens = getCursorTokens(codeMirror)
  _replaceSelection(
    codeMirror,
    cursorTokens.link,
    insertionTemplates.link,
    defaultUrl
  )
}

const insertImage = (codeMirror: CodeMirror.Editor) => {
  const cursorTokens = getCursorTokens(codeMirror)
  _replaceSelection(
    codeMirror,
    cursorTokens.image,
    insertionTemplates.image,
    defaultUrl
  )
}

const insertTable = (codeMirror: CodeMirror.Editor) => {
  const cursorTokens = getCursorTokens(codeMirror)
  _replaceSelection(codeMirror, cursorTokens.table, insertionTemplates.table)
}

const insertHorizontalRule = (codeMirror: CodeMirror.Editor) => {
  const cursorTokens = getCursorTokens(codeMirror)
  _replaceSelection(
    codeMirror,
    cursorTokens.image,
    insertionTemplates.horizontalRule
  )
}

const undo = (codeMirror: CodeMirror.Editor) => {
  codeMirror.undo()
  codeMirror.focus()
}

const redo = (codeMirror: CodeMirror.Editor) => {
  codeMirror.redo()
  codeMirror.focus()
}

const toggleSideBySide = (codeMirror: CodeMirror.Editor) => {
  const codeMirrorEl = codeMirror.getWrapperElement()
  const preview = codeMirrorEl.nextElementSibling
  const toolbarButton = toolbarElements['side-by-side']
  let useSideBySideListener = false

  if (preview?.classList.contains('editor-preview-active-side')) {
    preview.classList.remove('editor-preview-active-side')
    toolbarButton.classList.remove('active')
    codeMirrorEl.classList.remove('CodeMirror-sided')
  } else {
    if (!codeMirror.getOption('fullScreen')) {
      toggleFullScreen(codeMirror)
    }
    preview?.classList.add('editor-preview-active-side')
    toolbarButton.classList.add('active')
    codeMirrorEl.classList.add('CodeMirror-sided')
    useSideBySideListener = true
  }

  const fullscreenPreview = codeMirrorEl.lastElementChild
  if (fullscreenPreview?.classList.contains('editor-preview-active')) {
    fullscreenPreview.classList.remove('editor-preview-active')
    const toolbar = codeMirrorEl.previousElementSibling
    toolbar?.classList.remove('disabled-for-preview')
    toolbarElements.preview.classList.remove('active')
  }

  const renderPreview = () => {
    if (preview) {
      preview.innerHTML = marked(codeMirror.getValue(), markedOptions)
    }
  }

  if (useSideBySideListener) {
    renderPreview()
    codeMirror.on('update', renderPreview)
  } else {
    codeMirror.off('update', renderPreview)
  }
}

const togglePreview = (codeMirror: CodeMirror.Editor) => {
  const codeMirrorEl = codeMirror.getWrapperElement()
  const toolbar = codeMirrorEl.previousElementSibling
  let preview = codeMirrorEl.lastElementChild

  if (!preview || !preview.classList.contains('editor-preview')) {
    preview = document.createElement('div')
    preview.className = 'editor-preview'
    codeMirrorEl.appendChild(preview)
  }

  if (preview.classList.contains('editor-preview-active')) {
    preview.classList.remove('editor-preview-active')
    if (toolbar && toolbarElements.preview) {
      toolbarElements.preview.classList.remove('active')
      toolbar.classList.remove('disabled-for-preview')
    }
  } else {
    preview.innerHTML = marked(codeMirror.getValue(), markedOptions)
    preview.classList.add('editor-preview-active')
    if (toolbar && toolbarElements.preview) {
      toolbarElements.preview.classList.add('active')
      toolbar.classList.add('disabled-for-preview')
    }
  }

  const sidebyside = codeMirrorEl.nextElementSibling
  if (sidebyside?.classList.contains('editor-preview-active-side')) {
    toggleSideBySide(codeMirror)
  }
}

const _replaceSelection = (
  codeMirror: CodeMirror.Editor,
  isActive: boolean,
  template: string[],
  url?: string
) => {
  if (
    codeMirror
      .getWrapperElement()
      .lastElementChild?.classList.contains('editor-preview-active')
  ) {
    return
  }

  const startPoint = codeMirror.getCursor('start')
  const endPoint = codeMirror.getCursor('end')
  let [start, end] = template

  if (url) {
    end = end.replace('#url#', url)
  }

  if (isActive) {
    const text = codeMirror.getLine(startPoint.line)
    start = text.slice(0, startPoint.ch)
    end = text.slice(startPoint.ch)
    codeMirror.replaceRange(start + end, {
      line: startPoint.line,
      ch: 0,
    })
  } else {
    const text = codeMirror.getSelection()
    codeMirror.replaceSelection(start + text + end)
    startPoint.ch += start.length
    if (startPoint !== endPoint) {
      endPoint.ch += start.length
    }
  }

  codeMirror.setSelection(startPoint, endPoint)
  codeMirror.focus()
}

const _toggleHeading = (codeMirror: CodeMirror.Editor) => {
  if (
    codeMirror
      .getWrapperElement()
      .lastElementChild?.classList.contains('editor-preview-active')
  ) {
    return
  }

  const startPoint = codeMirror.getCursor('start')
  const endPoint = codeMirror.getCursor('end')

  for (let i = startPoint.line; i <= endPoint.line; i++) {
    let text = codeMirror.getLine(i)
    const currHeadingLevel = text.search(/[^#]/)

    if (currHeadingLevel <= 0) {
      text = '# ' + text
    } else if (currHeadingLevel == 6) {
      text = text.substr(7)
    } else {
      text = '#' + text
    }

    codeMirror.replaceRange(
      text,
      {
        line: i,
        ch: 0,
      },
      {
        line: i,
        ch: 99999999999999,
      }
    )
  }

  codeMirror.focus()
}

const _toggleLine = (
  codeMirror: CodeMirror.Editor,
  type: 'ordered-list' | 'quote' | 'unordered-list'
) => {
  if (
    codeMirror
      .getWrapperElement()
      .lastElementChild?.classList.contains('editor-preview-active')
  ) {
    return
  }

  const cursorTokens = getCursorTokens(codeMirror)
  const startPoint = codeMirror.getCursor('start')
  const endPoint = codeMirror.getCursor('end')

  const patterns = {
    'ordered-list': /^(\s*)\d+\.\s+/,
    'unordered-list': /^(\s*)(\*|-|\+)\s+/,
    quote: /^(\s*)>\s+/,
  }

  const map = {
    'ordered-list': '1. ',
    'unordered-list': '* ',
    quote: '> ',
  }

  for (let i = startPoint.line; i <= endPoint.line; i++) {
    let text = codeMirror.getLine(i)

    if (cursorTokens[type]) {
      text = text.replace(patterns[type], '$1')
    } else {
      text = map[type] + text
    }

    codeMirror.replaceRange(
      text,
      {
        line: i,
        ch: 0,
      },
      {
        line: i,
        ch: 99999999999999,
      }
    )
  }

  codeMirror.focus()
}

const _toggleBlock = (
  codeMirror: CodeMirror.Editor,
  type: 'bold' | 'italic' | 'strikethrough',
  startChars: string,
  endChars: string = startChars
) => {
  if (
    codeMirror
      .getWrapperElement()
      .lastElementChild?.classList.contains('editor-preview-active')
  ) {
    return
  }

  const startPoint = codeMirror.getCursor('start')
  const endPoint = codeMirror.getCursor('end')
  let start = startChars
  let end = endChars

  if (getCursorTokens(codeMirror)[type]) {
    let text = codeMirror.getLine(startPoint.line)
    start = text.slice(0, startPoint.ch)
    end = text.slice(startPoint.ch)

    if (type == 'bold') {
      start = start.replace(/(\*\*|__)(?![\s\S]*(\*\*|__))/, '')
      end = end.replace(/(\*\*|__)/, '')
    } else if (type == 'italic') {
      start = start.replace(/(\*|_)(?![\s\S]*(\*|_))/, '')
      end = end.replace(/(\*|_)/, '')
    } else if (type == 'strikethrough') {
      start = start.replace(/(\*\*|~~)(?![\s\S]*(\*\*|~~))/, '')
      end = end.replace(/(\*\*|~~)/, '')
    }

    codeMirror.replaceRange(
      start + end,
      {
        line: startPoint.line,
        ch: 0,
      },
      {
        line: startPoint.line,
        ch: 99999999999999,
      }
    )

    if (type == 'bold' || type == 'strikethrough') {
      startPoint.ch -= 2
      if (startPoint !== endPoint) {
        endPoint.ch -= 2
      }
    } else if (type == 'italic') {
      startPoint.ch -= 1
      if (startPoint !== endPoint) {
        endPoint.ch -= 1
      }
    }
  } else {
    let text = codeMirror.getSelection()

    if (type == 'bold') {
      text = text.split('**').join('')
      text = text.split('__').join('')
    } else if (type == 'italic') {
      text = text.split('*').join('')
      text = text.split('_').join('')
    } else if (type == 'strikethrough') {
      text = text.split('~~').join('')
    }

    codeMirror.replaceSelection(start + text + end)
    startPoint.ch += startChars.length
    endPoint.ch = startPoint.ch + text.length
  }

  codeMirror.setSelection(startPoint, endPoint)
  codeMirror.focus()
}

const _cleanBlock = (codeMirror: CodeMirror.Editor) => {
  if (
    codeMirror
      .getWrapperElement()
      .lastElementChild?.classList.contains('editor-preview-active')
  ) {
    return
  }

  const startPoint = codeMirror.getCursor('start')
  const endPoint = codeMirror.getCursor('end')

  for (let line = startPoint.line; line <= endPoint.line; line++) {
    const text = codeMirror
      .getLine(line)
      .replace(/^[ ]*([# ]+|\*|-|[> ]+|[0-9]+(.|\)))[ ]*/, '')

    codeMirror.replaceRange(
      text,
      {
        line,
        ch: 0,
      },
      {
        line,
        ch: 99999999999999,
      }
    )
  }
}

const toolbarButtons = [
  [
    {
      name: 'heading',
      action: toggleHeading,
      className: 'fa fa-header',
      title: 'Heading',
      shortcut: shortcuts.toggleHeading,
    },
    {
      name: 'bold',
      action: toggleBold,
      className: 'fa fa-bold',
      title: 'Bold',
      shortcut: shortcuts.toggleBold,
    },
    {
      name: 'italic',
      action: toggleItalic,
      className: 'fa fa-italic',
      title: 'Italic',
      shortcut: shortcuts.toggleItalic,
    },
    {
      name: 'strikethrough',
      action: toggleStrikethrough,
      className: 'fa fa-strikethrough',
      title: 'Strikethrough',
    },
  ],
  [
    {
      name: 'ordered-list',
      action: toggleOrderedList,
      className: 'fa fa-list-ol',
      title: 'Numbered List',
      shortcut: shortcuts.toggleOrderedList,
    },
    {
      name: 'unordered-list',
      action: toggleUnorderedList,
      className: 'fa fa-list-ul',
      title: 'Generic List',
      shortcut: shortcuts.toggleUnorderedList,
    },
    {
      name: 'quote',
      action: toggleBlockquote,
      className: 'fa fa-quote-right',
      title: 'Quote',
      shortcut: shortcuts.toggleBlockquote,
    },
  ],
  [
    {
      name: 'link',
      action: insertLink,
      className: 'fa fa-link',
      title: 'Create Link',
      shortcut: shortcuts.insertLink,
    },
    {
      name: 'image',
      action: insertImage,
      className: 'fa fa-image',
      title: 'Insert Image',
      shortcut: shortcuts.insertImage,
    },
    {
      name: 'table',
      action: insertTable,
      className: 'fa fa-table',
      title: 'Insert Table',
    },
    {
      name: 'horizontal-rule',
      action: insertHorizontalRule,
      className: 'fa fa-minus',
      title: 'Insert Horizontal Line',
    },
  ],
  [
    {
      name: 'preview',
      action: togglePreview,
      className: 'fa fa-eye no-disable',
      title: 'Toggle Preview',
    },
    {
      name: 'side-by-side',
      action: toggleSideBySide,
      className: 'fa fa-columns no-disable no-mobile',
      title: 'Toggle Side by Side',
    },
    {
      name: 'fullscreen',
      action: toggleFullScreen,
      className: 'fa fa-expand no-disable no-mobile',
      title: 'Toggle Fullscreen',
    },
  ],
  [
    {
      name: 'clean-block',
      action: cleanBlock,
      className: 'fa fa-eraser fa-clean-block',
      title: 'Clean block',
      shortcut: shortcuts.cleanBlock,
    },
  ],
  [
    {
      name: 'undo',
      action: undo,
      className: 'fa fa-rotate-left no-disable',
      title: 'Undo',
    },
    {
      name: 'redo',
      action: redo,
      className: 'fa fa-rotate-right no-disable',
      title: 'Redo',
    },
  ],
]

const bindings = {
  cleanBlock,
  insertHorizontalRule,
  insertImage,
  insertLink,
  insertTable,
  redo,
  toggleBlockquote,
  toggleBold,
  toggleFullScreen,
  toggleHeading,
  toggleItalic,
  toggleOrderedList,
  togglePreview,
  toggleSideBySide,
  toggleStrikethrough,
  toggleUnorderedList,
  undo,
}

const createSideBySide = (codeMirror: CodeMirror.Editor) => {
  const codeMirrorEl = codeMirror.getWrapperElement()
  let preview = codeMirrorEl.nextElementSibling

  if (!preview || !preview.classList.contains('editor-preview-side')) {
    preview = document.createElement('div')
    preview.className = 'editor-preview-side'
    codeMirrorEl.parentNode?.insertBefore(preview, codeMirrorEl.nextSibling)
  }

  let eScroll = false
  let pScroll = false

  // Sync editor/preview scroll
  codeMirror.on('scroll', (e) => {
    if (eScroll) {
      eScroll = false
      return
    }
    pScroll = true
    if (preview) {
      const height = e.getScrollInfo().height - e.getScrollInfo().clientHeight
      const ratio = e.getScrollInfo().top / height
      const move = (preview.scrollHeight - preview.clientHeight) * ratio
      preview.scrollTop = move
    }
  })

  // Sync preview/editor scroll
  preview.addEventListener('scroll', () => {
    if (pScroll) {
      pScroll = false
      return
    }
    eScroll = true
    if (preview) {
      const height = preview.scrollHeight - preview.clientHeight
      const ratio = preview.scrollTop / height
      const move =
        (codeMirror.getScrollInfo().height -
          codeMirror.getScrollInfo().clientHeight) *
        ratio
      codeMirror.scrollTo(0, move)
    }
  })
}

const createToolbar = (codeMirror: CodeMirror.Editor) => {
  const bar = document.createElement('div')
  bar.className = 'editor-toolbar'

  toolbarElements = {}
  for (const buttonGroup of toolbarButtons) {
    for (const button of buttonGroup) {
      const el = createIcon(button)

      if (button.action) {
        el.onclick = (e) => {
          e.preventDefault()
          button.action(codeMirror)
        }
      }

      toolbarElements[button.name] = el
      bar.appendChild(el)
    }

    bar.appendChild(createSeparator())
  }

  codeMirror.on('cursorActivity', () => {
    const cursorTokens = getCursorTokens(codeMirror)
    for (const key in toolbarElements) {
      const el = toolbarElements[key]
      if (cursorTokens[key]) {
        if (!el.classList.contains('active')) {
          el.classList.add('active')
        }
      } else if (key !== 'fullscreen' && key !== 'side-by-side') {
        el.classList.remove('active')
      }
    }
  })

  const codeMirrorEl = codeMirror.getWrapperElement()
  codeMirrorEl.parentNode?.insertBefore(bar, codeMirrorEl)
}

export default defineComponent({
  props: {
    placeholder: {
      type: String,
      default: '',
    },
    value: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const textarea = ref<HTMLTextAreaElement>()
    let autosaveInterval: number

    onMounted(() => {
      if (!textarea.value) {
        return
      }

      const extraKeys: CodeMirror.KeyMap = {
        Enter: 'newlineAndIndentContinueMarkdownList',
      }

      for (const key in shortcuts) {
        const keyTyped = key as keyof typeof shortcuts
        extraKeys[shortcuts[keyTyped]] = () => {
          bindings[keyTyped](codeMirror)
        }
      }

      const codeMirror = CodeMirror.fromTextArea(textarea.value, {
        allowDropFileTypes: ['text/plain'],
        autofocus: false,
        extraKeys,
        indentUnit: 2,
        indentWithTabs: true,
        lineNumbers: false,
        lineWrapping: true,
        mode: {
          gitHubSpice: false,
          highlightFormatting: true,
          name: 'gfm',
        },
        placeholder: props.placeholder,
        styleSelectedText: true,
        tabSize: 2,
        theme: 'paper',
      })

      createSideBySide(codeMirror)
      createToolbar(codeMirror)

      if (props.value) {
        codeMirror.setValue(props.value)
      }

      if (isLocalStorageAvailable()) {
        if (!props.value) {
          const autosavedValue = getAutosavedValue()
          if (autosavedValue) {
            codeMirror.setValue(autosavedValue)
          }
        }

        autosaveInterval = setInterval(() => {
          localStorage.setItem(autosaveKey, codeMirror.getValue())
        }, autosaveDelay)
      }
    })

    onBeforeUnmount(() => {
      clearInterval(autosaveInterval)
    })

    return {
      textarea,
    }
  },
})
</script>

<style lang="scss">
.editor-toolbar {
  position: relative;
  opacity: 0.6;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -o-user-select: none;
  user-select: none;
  padding: 0 10px;
  border-top: 1px solid #bbb;
  border-left: 1px solid #bbb;
  border-right: 1px solid #bbb;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;

  &::after,
  &::before {
    display: block;
    content: ' ';
    height: 1px;
  }

  &::before {
    margin-bottom: 8px;
  }

  &::after {
    margin-top: 8px;
  }

  &.fullscreen {
    width: 100%;
    height: 50px;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    padding-top: 10px;
    padding-bottom: 10px;
    box-sizing: border-box;
    background: #fff;
    border: 0;
    position: fixed;
    top: 0;
    left: 0;
    opacity: 1;
    z-index: 9;

    &:hover {
      opacity: 0.8;
    }

    &::before {
      width: 20px;
      height: 50px;
      background: -moz-linear-gradient(
        left,
        rgba(255, 255, 255, 1) 0%,
        rgba(255, 255, 255, 0) 100%
      );
      background: -webkit-gradient(
        linear,
        left top,
        right top,
        color-stop(0%, rgba(255, 255, 255, 1)),
        color-stop(100%, rgba(255, 255, 255, 0))
      );
      background: -webkit-linear-gradient(
        left,
        rgba(255, 255, 255, 1) 0%,
        rgba(255, 255, 255, 0) 100%
      );
      background: -o-linear-gradient(
        left,
        rgba(255, 255, 255, 1) 0%,
        rgba(255, 255, 255, 0) 100%
      );
      background: -ms-linear-gradient(
        left,
        rgba(255, 255, 255, 1) 0%,
        rgba(255, 255, 255, 0) 100%
      );
      background: linear-gradient(
        to right,
        rgba(255, 255, 255, 1) 0%,
        rgba(255, 255, 255, 0) 100%
      );
      position: fixed;
      top: 0;
      left: 0;
      margin: 0;
      padding: 0;
    }

    &::after {
      width: 20px;
      height: 50px;
      background: -moz-linear-gradient(
        left,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 1) 100%
      );
      background: -webkit-gradient(
        linear,
        left top,
        right top,
        color-stop(0%, rgba(255, 255, 255, 0)),
        color-stop(100%, rgba(255, 255, 255, 1))
      );
      background: -webkit-linear-gradient(
        left,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 1) 100%
      );
      background: -o-linear-gradient(
        left,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 1) 100%
      );
      background: -ms-linear-gradient(
        left,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 1) 100%
      );
      background: linear-gradient(
        to right,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 1) 100%
      );
      position: fixed;
      top: 0;
      right: 0;
      margin: 0;
      padding: 0;
    }
  }

  a {
    display: inline-block;
    text-align: center;
    text-decoration: none !important;
    color: #2c3e50 !important;
    width: 30px;
    height: 30px;
    margin: 0;
    border: 1px solid transparent;
    border-radius: 3px;
    cursor: pointer;

    &.active,
    &:hover {
      background: #fcfcfc;
      border-color: #95a5a6;
    }

    &::before {
      line-height: 30px;
    }
  }

  i {
    &.separator {
      display: inline-block;
      width: 0;
      border-left: 1px solid #d9d9d9;
      border-right: 1px solid #fff;
      color: transparent;
      text-indent: -10px;
      margin: 0 6px;

      &:last-child {
        display: none;
      }
    }
  }

  &.disabled-for-preview {
    a {
      &:not(.no-disable) {
        pointer-events: none;
        background: #fff;
        border-color: transparent;
        text-shadow: inherit;
      }
    }
  }

  @media only screen and (max-width: 700px) {
    a {
      &.no-mobile {
        display: none;
      }
    }
  }
}

.editor-preview {
  padding: 10px;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: #fafafa;
  z-index: 7;
  overflow: auto;
  display: none;
  box-sizing: border-box;

  &-side {
    padding: 10px;
    position: fixed;
    bottom: 0;
    width: 50%;
    top: 50px;
    right: 0;
    background: #fafafa;
    z-index: 9;
    overflow: auto;
    display: none;
    box-sizing: border-box;
    border: 1px solid #ddd;

    & > p {
      margin-top: 0;
    }

    pre {
      background: #eee;
      margin-bottom: 10px;
    }

    table {
      td,
      th {
        border: 1px solid #ddd;
        padding: 5px;
      }
    }
  }

  &-active-side {
    display: block;
  }

  &-active {
    display: block;
  }

  & > p {
    margin-top: 0;
  }

  pre {
    background: #eee;
    margin-bottom: 10px;
  }

  table {
    td,
    th {
      border: 1px solid #ddd;
      padding: 5px;
    }
  }
}

.editor-wrapper {
  input {
    &.title {
      &:focus,
      &:hover {
        opacity: 0.8;
      }
    }
  }
}
</style>
