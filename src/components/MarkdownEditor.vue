<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  EditorView,
  keymap,
  placeholder,
  type KeyBinding,
} from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import {
  defaultKeymap,
  history,
  historyKeymap,
  redoDepth,
  undoDepth,
} from '@codemirror/commands'
import { syntaxHighlighting } from '@codemirror/language'
import { markdown, markdownKeymap } from '@codemirror/lang-markdown'

import formatBoldIcon from '@material-design-icons/svg/sharp/format_bold.svg?raw'
import formatClearIcon from '@material-design-icons/svg/sharp/format_clear.svg?raw'
import formatItalicIcon from '@material-design-icons/svg/sharp/format_italic.svg?raw'
import formatListBulletedIcon from '@material-design-icons/svg/sharp/format_list_bulleted.svg?raw'
import formatListNumberedIcon from '@material-design-icons/svg/sharp/format_list_numbered.svg?raw'
import formatQuoteIcon from '@material-design-icons/svg/sharp/format_quote.svg?raw'
import imageIcon from '@material-design-icons/svg/sharp/image.svg?raw'
import indeterminateCheckBoxIcon from '@material-design-icons/svg/sharp/indeterminate_check_box.svg?raw'
import listAltIcon from '@material-design-icons/svg/sharp/list_alt.svg?raw'
import redoIcon from '@material-design-icons/svg/sharp/redo.svg?raw'
import textFieldsIcon from '@material-design-icons/svg/sharp/text_fields.svg?raw'
import undoIcon from '@material-design-icons/svg/sharp/undo.svg?raw'

import {
  editorCommands,
  editorSyntaxHighlightStyle,
  getActiveCommands,
  isMac,
  type EditorCommand,
} from '@/utils'

const commandGroups: EditorCommand[][] = [
  ['heading', 'bold', 'italic'],
  ['ul', 'ol', 'blockquote'],
  ['image', 'table', 'hr'],
  ['clean'],
  ['undo', 'redo'],
]

const commandIcons: Record<EditorCommand, string> = {
  blockquote: formatQuoteIcon,
  bold: formatBoldIcon,
  clean: formatClearIcon,
  heading: textFieldsIcon,
  hr: indeterminateCheckBoxIcon,
  image: imageIcon,
  italic: formatItalicIcon,
  ol: formatListNumberedIcon,
  redo: redoIcon,
  table: listAltIcon,
  ul: formatListBulletedIcon,
  undo: undoIcon,
}

const commandKeys: Partial<Record<EditorCommand, string>> = {
  blockquote: "Mod-'",
  bold: 'Mod-b',
  clean: 'Mod-e',
  heading: 'Mod-h',
  image: 'Mod-Alt-i',
  italic: 'Mod-i',
  ol: 'Mod-Alt-l',
  ul: 'Mod-l',
}

const commandKeysLocalized = Object.entries(commandKeys).reduce(
  (acc, [command, key]) => ({
    ...acc,
    [command]: isMac
      ? key.toUpperCase().replace('MOD-', '⌘-').replace('ALT-', '⌥-')
      : key.toUpperCase().replace('MOD-', 'Ctrl-').replace('ALT-', 'Alt-'),
  }),
  commandKeys
)

const customKeymap: KeyBinding[] = Object.entries(commandKeys).map(
  ([command, key]) => ({
    key,
    run: editorCommands[command as EditorCommand],
  })
)

const props = withDefaults(
  defineProps<{
    placeholder: string
    value: string
  }>(),
  {
    placeholder: '',
    value: '',
  }
)

const emit = defineEmits<{
  (e: 'input', value: string): void
}>()

const { t } = useI18n()
const container = ref<HTMLDivElement>()
const activeButtons = ref<Partial<Record<EditorCommand, boolean>>>({})
const disabledButtons = ref<Partial<Record<EditorCommand, boolean>>>({
  redo: true,
  undo: true,
})
let codeMirror: EditorView

const extensions = [
  EditorView.lineWrapping,
  EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      disabledButtons.value.redo = !redoDepth(codeMirror.state)
      disabledButtons.value.undo = !undoDepth(codeMirror.state)
      emit('input', update.state.doc.toString())
    }
    if (update.selectionSet) {
      activeButtons.value = getActiveCommands(codeMirror.state)
    }
  }),
  history(),
  markdown(),
  placeholder(props.placeholder),
  syntaxHighlighting(editorSyntaxHighlightStyle),
  keymap.of([
    ...customKeymap,
    ...markdownKeymap,
    ...historyKeymap,
    ...defaultKeymap,
  ]),
]

onMounted(() => {
  codeMirror = new EditorView({
    extensions,
    parent: container.value,
  })
})

watch(
  () => props.value,
  () => {
    codeMirror.setState(EditorState.create({ doc: props.value, extensions }))
  }
)

const toolbarButtons = computed(() => {
  return commandGroups.map((group) =>
    group.map((command) => ({
      action: () => {
        editorCommands[command](codeMirror)
        codeMirror.focus()
      },
      icon: commandIcons[command],
      name: command,
      tooltip:
        t(`MarkdownEditor.Commands.${command}`) +
        (commandKeysLocalized[command]
          ? ` (${commandKeysLocalized[command]})`
          : ''),
    }))
  )
})
</script>

<template>
  <div ref="container" class="markdown-editor">
    <div class="markdown-editor__toolbar">
      <template v-for="(buttonGroup, i) in toolbarButtons" :key="i">
        <button
          v-for="button in buttonGroup"
          :key="button.name"
          :class="{ active: activeButtons[button.name] }"
          :disabled="disabledButtons[button.name]"
          :title="button.tooltip"
          tabindex="-1"
          @click="button.action"
          v-html="button.icon"
        />

        <span class="separator">|</span>
      </template>
    </div>
  </div>
</template>

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

  .cm-editor {
    height: calc(100% - 65px);
  }
}
</style>
