import {
  EditorSelection,
  EditorState,
  type ChangeSpec,
  type StateCommand,
  type TransactionSpec,
} from '@codemirror/state'
import { redo, undo } from '@codemirror/commands'
import { syntaxTree } from '@codemirror/language'
import type { SyntaxNode } from '@lezer/common'

export type EditorCommand =
  | 'blockquote'
  | 'bold'
  | 'clean'
  | 'heading'
  | 'hr'
  | 'image'
  | 'italic'
  | 'ol'
  | 'redo'
  | 'table'
  | 'ul'
  | 'undo'

const blockStyles = {
  bold: '**',
  italic: '*',
}

const toggleBlock =
  (type: keyof typeof blockStyles): StateCommand =>
  ({ state, dispatch }) => {
    const style = blockStyles[type]

    const changeTransaction: TransactionSpec = state.changeByRange((range) => {
      const isBlockBefore =
        state.sliceDoc(range.from - style.length, range.from) === style
      const isBlockAfter =
        state.sliceDoc(range.to, range.to + style.length) === style

      const changes: ChangeSpec[] = [
        isBlockBefore
          ? {
              from: range.from - style.length,
              to: range.from,
              insert: '',
            }
          : {
              from: range.from,
              insert: style,
            },
        isBlockAfter
          ? {
              from: range.to,
              to: range.to + style.length,
              insert: '',
            }
          : {
              from: range.to,
              insert: style,
            },
      ]

      const fromShift = isBlockBefore ? -style.length : style.length
      const afterShift = isBlockAfter ? -style.length : style.length

      return {
        changes,
        range: EditorSelection.range(
          range.from + fromShift,
          range.to + afterShift
        ),
      }
    })

    dispatch(state.update(changeTransaction))

    return true
  }

const toggleHeading: StateCommand = ({ state, dispatch }) => {
  const changeTransaction: TransactionSpec = state.changeByRange((range) => {
    const lineFrom = state.doc.lineAt(range.from)
    const lineTo = state.doc.lineAt(range.to)
    const lines = [lineFrom]
    if (lineFrom.number !== lineTo.number) {
      for (let i = lineFrom.number + 1; i <= lineTo.number; i++) {
        lines.push(state.doc.line(i))
      }
    }

    let fromShift = 0
    let afterShift = 0

    const changes = lines.reduce<ChangeSpec[]>((acc, line, i) => {
      let change: ChangeSpec
      if (/^#{6}\s/.test(line.text)) {
        afterShift -= 7
        change = {
          from: line.from,
          to: line.from + 7,
          insert: '',
        }
      } else if (/^#{1,5}\s/.test(line.text)) {
        afterShift += 1
        change = {
          from: line.from,
          insert: '#',
        }
      } else {
        afterShift += 2
        change = {
          from: line.from,
          insert: '# ',
        }
      }
      if (i === 0) {
        fromShift = afterShift
      }
      return acc.concat(change)
    }, [])

    return {
      changes,
      range: EditorSelection.range(
        range.from + fromShift,
        range.to + afterShift
      ),
    }
  })

  dispatch(state.update(changeTransaction))

  return true
}

export const editorCommands: Record<EditorCommand, StateCommand> = {
  blockquote: (_) => true,
  bold: toggleBlock('bold'),
  clean: (_) => true,
  heading: toggleHeading,
  hr: (_) => true,
  image: (_) => true,
  italic: toggleBlock('italic'),
  ol: (_) => true,
  redo,
  table: (_) => true,
  ul: (_) => true,
  undo,
}

export const getActiveCommands = (state: EditorState) => {
  const activeCommands: Partial<Record<EditorCommand, boolean>> = {}
  const { anchor } = state.selection.main
  let node: SyntaxNode | null = syntaxTree(state).resolve(anchor)
  while (node) {
    switch (node.name) {
      case 'ATXHeading1':
      case 'ATXHeading2':
      case 'ATXHeading3':
      case 'ATXHeading4':
      case 'ATXHeading5':
      case 'ATXHeading6':
        activeCommands.heading = true
        break
      case 'Emphasis':
        activeCommands.italic = true
        break
      case 'StrongEmphasis':
        activeCommands.bold = true
        break
    }
    node = node.parent
  }
  return activeCommands
}
