<template>
  <div ref="container" class="markdown-editor">
    <div class="markdown-editor__toolbar">
      <template v-for="(buttonGroup, i) in toolbarButtons" :key="i">
        <button
          v-for="button in buttonGroup"
          :key="button.name"
          v-html="button?.icon"
          :class="{ active: cursorTokens[button.name] }"
          :disabled="button.disabled"
          :title="button.tooltip"
          tabindex="-1"
          @click="button.action"
        />

        <span class="separator">|</span>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CodeMirror from 'codemirror'

import datasetIcon from '@material-design-icons/svg/sharp/dataset.svg?raw'
import formatBoldIcon from '@material-design-icons/svg/sharp/format_bold.svg?raw'
import formatClearIcon from '@material-design-icons/svg/sharp/format_clear.svg?raw'
import formatItalicIcon from '@material-design-icons/svg/sharp/format_italic.svg?raw'
import formatListBulletedIcon from '@material-design-icons/svg/sharp/format_list_bulleted.svg?raw'
import formatListNumberedIcon from '@material-design-icons/svg/sharp/format_list_numbered.svg?raw'
import formatQuoteIcon from '@material-design-icons/svg/sharp/format_quote.svg?raw'
import horizontalRuleIcon from '@material-design-icons/svg/sharp/horizontal_rule.svg?raw'
import imageIcon from '@material-design-icons/svg/sharp/image.svg?raw'
import linkIcon from '@material-design-icons/svg/sharp/link.svg?raw'
import redoIcon from '@material-design-icons/svg/sharp/redo.svg?raw'
import strikethroughIcon from '@material-design-icons/svg/sharp/strikethrough_s.svg?raw'
import titleIcon from '@material-design-icons/svg/sharp/title.svg?raw'
import undoIcon from '@material-design-icons/svg/sharp/undo.svg?raw'

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
    const historySize = ref({ redo: 0, undo: 0 })
    let codeMirror: CodeMirror.Editor

    const resetValue = () => {
      codeMirror.setValue(props.value)
      codeMirror.clearHistory()
      historySize.value = codeMirror.historySize()
    }

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
        historySize.value = codeMirror.historySize()
      })

      if (props.value) {
        resetValue()
      }
    })

    watch(
      () => props.placeholder,
      () => {
        codeMirror.setOption('placeholder', props.placeholder)
      }
    )

    watch(() => props.value, resetValue)

    const toolbarButtons = computed(() => [
      [
        {
          action: () => toggleHeading(codeMirror),
          icon: titleIcon,
          name: 'heading',
          tooltip: `${t('MarkdownEditor.heading')} (${
            shortcuts.toggleHeading
          })`,
        },
        {
          action: () => toggleBold(codeMirror),
          icon: formatBoldIcon,
          name: 'bold',
          tooltip: `${t('MarkdownEditor.bold')} (${shortcuts.toggleBold})`,
        },
        {
          action: () => toggleItalic(codeMirror),
          icon: formatItalicIcon,
          className: 'fa fa-italic',
          name: 'italic',
          tooltip: `${t('MarkdownEditor.italic')} (${shortcuts.toggleItalic})`,
        },
        {
          action: () => toggleStrikethrough(codeMirror),
          icon: strikethroughIcon,
          name: 'strikethrough',
          tooltip: t('MarkdownEditor.strikethrough'),
        },
      ],
      [
        {
          action: () => toggleUnorderedList(codeMirror),
          icon: formatListBulletedIcon,
          name: 'unorderedList',
          tooltip: `${t('MarkdownEditor.unorderedList')} (${
            shortcuts.toggleUnorderedList
          })`,
        },
        {
          action: () => toggleOrderedList(codeMirror),
          icon: formatListNumberedIcon,
          name: 'orderedList',
          tooltip: `${t('MarkdownEditor.orderedList')} (${
            shortcuts.toggleOrderedList
          })`,
        },
        {
          action: () => toggleBlockquote(codeMirror),
          icon: formatQuoteIcon,
          name: 'quote',
          tooltip: `${t('MarkdownEditor.quote')} (${
            shortcuts.toggleBlockquote
          })`,
        },
      ],
      [
        {
          action: () => insertLink(codeMirror),
          icon: linkIcon,
          name: 'link',
          tooltip: `${t('MarkdownEditor.link')} (${shortcuts.insertLink})`,
        },
        {
          action: () => insertImage(codeMirror),
          icon: imageIcon,
          name: 'image',
          tooltip: `${t('MarkdownEditor.image')} (${shortcuts.insertImage})`,
        },
        {
          action: () => insertTable(codeMirror),
          icon: datasetIcon,
          name: 'table',
          tooltip: `${t('MarkdownEditor.table')} (${shortcuts.insertImage})`,
        },
        {
          action: () => insertHorizontalRule(codeMirror),
          icon: horizontalRuleIcon,
          name: 'horizontalRule',
          tooltip: `${t('MarkdownEditor.horizontalRule')} (${
            shortcuts.insertImage
          })`,
        },
      ],
      [
        {
          action: () => cleanBlock(codeMirror),
          icon: formatClearIcon,
          name: 'cleanBlock',
          tooltip: `${t('MarkdownEditor.cleanBlock')} (${
            shortcuts.cleanBlock
          })`,
        },
      ],
      [
        {
          action: () => undo(codeMirror),
          disabled: !historySize.value.undo,
          icon: undoIcon,
          name: 'undo',
          tooltip: t('MarkdownEditor.undo'),
        },
        {
          action: () => redo(codeMirror),
          disabled: !historySize.value.redo,
          icon: redoIcon,
          name: 'redo',
          tooltip: t('MarkdownEditor.redo'),
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

<style lang="scss">
.markdown-editor {
  display: flex;
  flex-direction: column;
  min-height: 0;

  &__toolbar {
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 16px 0;
    min-height: 65px;
    border-bottom: 1px solid var(--color-border);
    overflow: auto hidden;
    user-select: none;

    &::before,
    &::after {
      content: '';
      flex: 0 0 16px;
    }

    button {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0;
      min-width: 32px;
      height: 32px;
      border: 1px solid transparent;
      border-radius: 50%;
      background-color: transparent;
      color: var(--color-text);
      transition: border 0.1s;
      cursor: pointer;

      &:disabled {
        cursor: default;
        pointer-events: none;

        svg {
          fill: var(--color-border);
        }
      }

      &:not(:disabled) {
        &:hover {
          border-color: var(--color-border);
        }

        &.active {
          border-color: var(--color-text);
        }
      }

      svg {
        width: 22px;
        height: 22px;
        fill: var(--color-text);
      }
    }

    .separator {
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
</style>
