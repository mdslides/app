import {
  EditorSelection,
  type ChangeSpec,
  type EditorState,
  type SelectionRange,
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

const getAffectedLines = (state: EditorState, range: SelectionRange) => {
  const lineFrom = state.doc.lineAt(range.from)
  const lineTo = state.doc.lineAt(range.to)
  const lines = [lineFrom]
  if (lineFrom.number !== lineTo.number) {
    for (let i = lineFrom.number + 1; i <= lineTo.number; i++) {
      lines.push(state.doc.line(i))
    }
  }
  return lines
}

const templates = {
  hr: '---',
  image: '![]()',
  table: [
    '| Column 1 | Column 2 | Column 3 |',
    '| --- | --- | --- |',
    '| Text | Text | Text |',
  ].join('\n'),
}

const insertTemplate =
  (type: keyof typeof templates): StateCommand =>
  ({ state, dispatch }) => {
    const changeTransaction: TransactionSpec = state.changeByRange((range) => {
      const lineFrom = state.doc.lineAt(range.from)
      const lineTo = state.doc.lineAt(range.to)

      const textBounds: [string, string] = [
        range.from === lineFrom.from
          ? lineFrom.number === 1 || !state.doc.line(lineFrom.number - 1).text
            ? ''
            : '\n'
          : '\n\n',
        type === 'hr' || range.to !== lineTo.to
          ? '\n\n'
          : lineTo.number === state.doc.lines ||
            !state.doc.line(lineTo.number + 1).text
          ? ''
          : '\n',
      ]
      const text = textBounds.join(templates[type])

      let selectionAnchor = range.from
      let selectionHead = range.to

      switch (type) {
        case 'hr':
          selectionAnchor += text.length
          selectionHead = selectionAnchor
          break
        case 'image':
          selectionAnchor += text.length - textBounds[1].length - 1
          selectionHead = selectionAnchor
          break
        case 'table':
          selectionAnchor += textBounds[0].length + 2
          selectionHead = selectionAnchor + 8
          break
      }

      return {
        changes: [
          {
            from: range.from,
            to: range.to,
            insert: text,
          },
        ],
        range: EditorSelection.range(selectionAnchor, selectionHead),
      }
    })

    dispatch(state.update(changeTransaction, { scrollIntoView: true }))
    return true
  }

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
      const toShift = isBlockAfter ? -style.length : style.length

      return {
        changes,
        range: EditorSelection.range(
          range.from + fromShift,
          range.to + toShift
        ),
      }
    })

    dispatch(state.update(changeTransaction, { scrollIntoView: true }))
    return true
  }

const blockquotePattern = /^>\s/

const toggleBlockquote: StateCommand = ({ state, dispatch }) => {
  const changeTransaction: TransactionSpec = state.changeByRange((range) => {
    const lines = getAffectedLines(state, range)
    let shiftFrom = 0
    let shiftTo = 0

    const isTogglingOn = !lines.every((line) =>
      blockquotePattern.test(line.text)
    )

    const changes = lines.reduce<ChangeSpec[]>((acc, line, i) => {
      let change: ChangeSpec | undefined
      if (isTogglingOn) {
        if (!blockquotePattern.test(line.text)) {
          shiftTo += 2
          change = {
            from: line.from,
            insert: '> ',
          }
        }
      } else {
        if (blockquotePattern.test(line.text)) {
          shiftTo -= 2
          change = {
            from: line.from,
            to: line.from + 2,
            insert: '',
          }
        }
      }
      if (i === 0) {
        shiftFrom = shiftTo
      }
      return change ? acc.concat(change) : acc
    }, [])

    return {
      changes,
      range: EditorSelection.range(range.from + shiftFrom, range.to + shiftTo),
    }
  })

  dispatch(state.update(changeTransaction, { scrollIntoView: true }))
  return true
}

const toggleHeading: StateCommand = ({ state, dispatch }) => {
  const changeTransaction: TransactionSpec = state.changeByRange((range) => {
    const lines = getAffectedLines(state, range)
    let shiftFrom = 0
    let shiftTo = 0

    const changes = lines.reduce<ChangeSpec[]>((acc, line, i) => {
      let change: ChangeSpec
      if (/^#{6}\s/.test(line.text)) {
        shiftTo -= 7
        change = {
          from: line.from,
          to: line.from + 7,
          insert: '',
        }
      } else if (/^#{1,5}\s/.test(line.text)) {
        shiftTo += 1
        change = {
          from: line.from,
          insert: '#',
        }
      } else {
        shiftTo += 2
        change = {
          from: line.from,
          insert: '# ',
        }
      }
      if (i === 0) {
        shiftFrom = shiftTo
      }
      return acc.concat(change)
    }, [])

    return {
      changes,
      range: EditorSelection.range(range.from + shiftFrom, range.to + shiftTo),
    }
  })

  dispatch(state.update(changeTransaction, { scrollIntoView: true }))
  return true
}

const listPatterns = {
  ol: /^\d+\.\s/,
  ul: /^-\s/,
}

const toggleList =
  (type: keyof typeof listPatterns): StateCommand =>
  ({ state, dispatch }) => {
    const changeTransaction: TransactionSpec = state.changeByRange((range) => {
      const pattern = listPatterns[type]
      const patternOpposite = listPatterns[type === 'ol' ? 'ul' : 'ol']
      const lines = getAffectedLines(state, range)
      let shiftFrom = 0
      let shiftTo = 0

      const isTogglingOn = !lines.every((line) => pattern.test(line.text))

      const changes = lines.reduce<ChangeSpec[]>((acc, line, i) => {
        const insert = type === 'ol' ? `${i + 1}. ` : '- '
        let change: ChangeSpec | undefined

        if (isTogglingOn) {
          if (pattern.test(line.text)) {
            return acc
          } else if (patternOpposite.test(line.text)) {
            const remove = line.text.match(patternOpposite)?.[0] ?? ''
            shiftTo += insert.length - remove.length
            change = {
              from: line.from,
              to: line.from + remove.length,
              insert,
            }
          } else {
            shiftTo += insert.length
            change = {
              from: line.from,
              insert,
            }
          }
        } else {
          const remove =
            line.text.match(pattern)?.[0] ??
            line.text.match(patternOpposite)?.[0]
          if (remove?.length) {
            shiftTo -= remove.length
            change = {
              from: line.from,
              to: line.from + remove.length,
              insert: '',
            }
          }
        }
        if (i === 0) {
          shiftFrom = shiftTo
        }
        return change ? acc.concat(change) : acc
      }, [])

      return {
        changes,
        range: EditorSelection.range(
          range.from + shiftFrom,
          range.to + shiftTo
        ),
      }
    })

    dispatch(state.update(changeTransaction, { scrollIntoView: true }))
    return true
  }

export const editorCommands: Record<EditorCommand, StateCommand> = {
  blockquote: toggleBlockquote,
  bold: toggleBlock('bold'),
  clean: (_) => true,
  heading: toggleHeading,
  hr: insertTemplate('hr'),
  image: insertTemplate('image'),
  italic: toggleBlock('italic'),
  ol: toggleList('ol'),
  redo,
  table: insertTemplate('table'),
  ul: toggleList('ul'),
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
