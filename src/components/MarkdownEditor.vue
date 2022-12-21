<template>
  <div ref="container" class="markdown-editor">
    <div class="markdown-editor__toolbar">
      <template v-for="(buttonGroup, i) in toolbarButtons" :key="i">
        <a
          v-for="button in buttonGroup"
          :key="button.name"
          :class="[button.className, { active: cursorTokens[button.name] }]"
          :title="button.tooltip"
          tabindex="-1"
          @click.prevent="button.action"
        />

        <i class="separator">|</i>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CodeMirror from 'codemirror'

import 'codemirror/addon/display/placeholder'
import 'codemirror/addon/edit/continuelist'
import 'codemirror/addon/selection/mark-selection'
import 'codemirror/mode/gfm/gfm'
import 'codemirror/mode/markdown/markdown'
import 'codemirror/mode/xml/xml'

import { isMac } from '@/utils'

const defaultUrl = 'http://'

const codeMirrorOptions: CodeMirror.EditorConfiguration = {
  autofocus: false,
  indentUnit: 2,
  indentWithTabs: true,
  lineNumbers: false,
  lineWrapping: true,
  mode: {
    gitHubSpice: false,
    highlightFormatting: true,
    name: 'gfm',
  },
  styleSelectedText: true,
  tabSize: 2,
  theme: 'paper',
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
      cleanBlock: '⌘-E',
      insertImage: '⌘-⌥-I',
      insertLink: '⌘-K',
      toggleBlockquote: "⌘-'",
      toggleBold: '⌘-B',
      toggleHeading: '⌘-H',
      toggleItalic: '⌘-I',
      toggleOrderedList: '⌘-⌥-L',
      toggleUnorderedList: '⌘-L',
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
          tokens.orderedList = true
        } else {
          tokens.unorderedList = true
        }
        break
    }
  }

  return tokens
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

const _replaceSelection = (
  codeMirror: CodeMirror.Editor,
  isActive: boolean,
  template: string[],
  url?: string
) => {
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
  emits: ['input'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const container = ref<HTMLDivElement>()
    const cursorTokens = ref<Record<string, boolean>>({})
    let codeMirror: CodeMirror.Editor

    onMounted(() => {
      if (!container.value) {
        return
      }

      const extraKeys: CodeMirror.KeyMap = {
        Enter: 'newlineAndIndentContinueMarkdownList',
      }

      const shortcutActions: Record<
        keyof typeof shortcuts,
        (codeMirror: CodeMirror.Editor) => void
      > = {
        cleanBlock,
        insertImage,
        insertLink,
        toggleBlockquote,
        toggleBold,
        toggleHeading,
        toggleItalic,
        toggleOrderedList,
        toggleUnorderedList,
      }

      for (const key in shortcuts) {
        const keyTyped = key as keyof typeof shortcuts
        const shortcut = shortcuts[keyTyped]
          .replace('⌘', 'Cmd')
          .replace('⌥', 'Alt')
        extraKeys[shortcut] = () => {
          shortcutActions[keyTyped](codeMirror)
        }
      }

      codeMirror = CodeMirror(container.value, {
        ...codeMirrorOptions,
        extraKeys,
        placeholder: props.placeholder,
      })

      codeMirror.on('cursorActivity', () => {
        cursorTokens.value = getCursorTokens(codeMirror)
      })

      codeMirror.on('update', () => {
        emit('input', codeMirror.getValue())
      })

      if (props.value) {
        codeMirror.setValue(props.value)
      }
    })

    watch(
      () => props.placeholder,
      () => {
        codeMirror.setOption('placeholder', props.placeholder)
      }
    )

    watch(
      () => props.value,
      () => {
        codeMirror.setValue(props.value)
      }
    )

    const toolbarButtons = computed(() => [
      [
        {
          action: () => toggleHeading(codeMirror),
          className: 'fa fa-header',
          name: 'heading',
          tooltip: `${t('heading')} (${shortcuts.toggleHeading})`,
        },
        {
          action: () => toggleBold(codeMirror),
          className: 'fa fa-bold',
          name: 'bold',
          tooltip: `${t('bold')} (${shortcuts.toggleBold})`,
        },
        {
          action: () => toggleItalic(codeMirror),
          className: 'fa fa-italic',
          name: 'italic',
          tooltip: `${t('italic')} (${shortcuts.toggleItalic})`,
        },
        {
          action: () => toggleStrikethrough(codeMirror),
          className: 'fa fa-strikethrough',
          name: 'strikethrough',
          tooltip: t('strikethrough'),
        },
      ],
      [
        {
          action: () => toggleOrderedList(codeMirror),
          className: 'fa fa-list-ol',
          name: 'orderedList',
          tooltip: `${t('orderedList')} (${shortcuts.toggleOrderedList})`,
        },
        {
          action: () => toggleUnorderedList(codeMirror),
          className: 'fa fa-list-ul',
          name: 'unorderedList',
          tooltip: `${t('unorderedList')} (${shortcuts.toggleUnorderedList})`,
        },
        {
          action: () => toggleBlockquote(codeMirror),
          className: 'fa fa-quote-right',
          name: 'quote',
          tooltip: `${t('quote')} (${shortcuts.toggleBlockquote})`,
        },
      ],
      [
        {
          action: () => insertLink(codeMirror),
          className: 'fa fa-link',
          name: 'link',
          tooltip: `${t('link')} (${shortcuts.insertLink})`,
        },
        {
          action: () => insertImage(codeMirror),
          className: 'fa fa-image',
          name: 'image',
          tooltip: `${t('image')} (${shortcuts.insertImage})`,
        },
        {
          action: () => insertTable(codeMirror),
          className: 'fa fa-table',
          name: 'table',
          tooltip: `${t('table')} (${shortcuts.insertImage})`,
        },
        {
          action: () => insertHorizontalRule(codeMirror),
          className: 'fa fa-minus',
          name: 'horizontalRule',
          tooltip: `${t('horizontalRule')} (${shortcuts.insertImage})`,
        },
      ],
      [
        {
          action: () => cleanBlock(codeMirror),
          className: 'fa fa-eraser fa-clean-block',
          name: 'cleanBlock',
          tooltip: `${t('cleanBlock')} (${shortcuts.cleanBlock})`,
        },
      ],
      [
        {
          action: () => undo(codeMirror),
          className: 'fa fa-rotate-left no-disable',
          name: 'undo',
          tooltip: t('undo'),
        },
        {
          action: () => redo(codeMirror),
          className: 'fa fa-rotate-right no-disable',
          name: 'redo',
          tooltip: t('redo'),
        },
      ],
    ])

    return {
      container,
      cursorTokens,
      toolbarButtons,
    }
  },
})
</script>

<i18n>
{
  "en": {
    "bold": "Bold",
    "cleanBlock": "Clean Block",
    "heading": "Heading",
    "horizontalRule": "Insert Horizontal Line",
    "image": "Insert Image",
    "italic": "Italic",
    "link": "Insert Link",
    "orderedList": "Numbered List",
    "quote": "Quote",
    "redo": "Redo",
    "strikethrough": "Strikethrough",
    "table": "Insert Table",
    "undo": "Undo",
    "unorderedList": "Bulleted List"
  }
}
</i18n>

<style lang="scss" scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  min-height: 0;

  &__toolbar {
    position: relative;
    display: flex;
    gap: 4px;
    padding: 16px 0;
    min-height: 69px;
    border-bottom: 1px solid var(--color-border);
    overflow: auto hidden;
    user-select: none;

    &::before,
    &::after {
      content: '';
      flex: 0 0 16px;
    }

    a {
      display: block;
      padding: 2px;
      min-width: 36px;
      height: 36px;
      border: 1px solid transparent;
      border-radius: 50%;
      text-align: center;
      text-decoration: none;
      color: var(--color-text);
      transition: border 0.1s;
      cursor: pointer;

      &::before {
        line-height: 30px;
      }

      &:hover {
        border-color: var(--color-border);
      }

      &.active {
        border-color: var(--color-text);
      }
    }

    i {
      &.separator {
        display: inline-block;
        margin: 0 8px;
        width: 1px;
        background-color: var(--color-border);
        color: transparent;

        &:last-child {
          display: none;
        }
      }
    }
  }
}
</style>
