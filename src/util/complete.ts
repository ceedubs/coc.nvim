import { CompleteOption, VimCompleteItem } from '../types'
import { Range, Position, CompletionItem, InsertTextFormat, CompletionItemKind } from 'vscode-languageserver-types'
import { byteSlice } from './string'

export function isCocItem(item: any): boolean {
  if (!item || !item.hasOwnProperty('user_data')) return false
  let { user_data } = item
  try {
    let res = JSON.parse(user_data)
    return res.cid != null
  } catch (e) {
    return false
  }
}

export function getPosition(opt: CompleteOption): Position {
  let { line, linenr, col, colnr } = opt
  let part = byteSlice(line, 0, col - 1)
  return {
    line: linenr - 1,
    character: part.length + 1 + (colnr - col > 1 ? 1 : 0)
  }
}

export function getWord(item: CompletionItem): string {
  // tslint:disable-next-line: deprecation
  let { label, insertTextFormat, insertText } = item
  if (insertTextFormat == InsertTextFormat.Snippet) {
    return label
  }
  return insertText || label
}

export function getDocumentation(item: CompletionItem): string | null {
  let { documentation } = item
  if (!documentation) return null
  if (typeof documentation === 'string') return documentation
  return documentation.value
}

export function completionKindString(kind: CompletionItemKind): string {
  switch (kind) {
    case CompletionItemKind.Text:
      return 'Text'
    case CompletionItemKind.Method:
      return 'Method'
    case CompletionItemKind.Function:
      return 'Function'
    case CompletionItemKind.Constructor:
      return 'Constructor'
    case CompletionItemKind.Field:
      return 'Field'
    case CompletionItemKind.Variable:
      return 'Variable'
    case CompletionItemKind.Class:
      return 'Class'
    case CompletionItemKind.Interface:
      return 'Interface'
    case CompletionItemKind.Module:
      return 'Module'
    case CompletionItemKind.Property:
      return 'Property'
    case CompletionItemKind.Unit:
      return 'Unit'
    case CompletionItemKind.Value:
      return 'Value'
    case CompletionItemKind.Enum:
      return 'Enum'
    case CompletionItemKind.Keyword:
      return 'Keyword'
    case CompletionItemKind.Snippet:
      return 'Snippet'
    case CompletionItemKind.Color:
      return 'Color'
    case CompletionItemKind.File:
      return 'File'
    case CompletionItemKind.Reference:
      return 'Reference'
    case CompletionItemKind.Folder:
      return 'Folder'
    case CompletionItemKind.EnumMember:
      return 'EnumMember'
    case CompletionItemKind.Constant:
      return 'Constant'
    case CompletionItemKind.Struct:
      return 'Struct'
    case CompletionItemKind.Event:
      return 'Event'
    case CompletionItemKind.Operator:
      return 'Operator'
    case CompletionItemKind.TypeParameter:
      return 'TypeParameter'
    default:
      return ''
  }
}

export function convertVimCompleteItem(item: CompletionItem, shortcut: string, opt: CompleteOption): VimCompleteItem {
  let isSnippet = item.insertTextFormat === InsertTextFormat.Snippet
  let obj: VimCompleteItem = {
    word: this.getWord(item),
    menu: item.detail ? `${item.detail.replace(/\n/, ' ')} [${shortcut}]` : `[${shortcut}]`,
    kind: this.completionKindString(item.kind),
    sortText: validString(item.sortText) ? item.sortText : item.label,
    filterText: validString(item.filterText) ? item.filterText : item.label,
    isSnippet
  }
  if (item.preselect) obj.sortText = '\0' + obj.sortText
  // tslint:disable-next-line: deprecation
  if (!isSnippet && !item.insertText && item.textEdit) {
    obj.word = item.textEdit.newText
    // make sure we can find it on CompleteDone
    // tslint:disable-next-line: deprecation
    item.insertText = obj.word
  }
  // tslint:disable-next-line: deprecation
  if (isSnippet && item.insertText && !item.textEdit) {
    let line = opt.linenr - 1
    // use textEdit for snippet
    item.textEdit = {
      range: Range.create(line, opt.col - 1, line, opt.colnr - 1),
      // tslint:disable-next-line: deprecation
      newText: item.insertText
    }
  }
  obj.abbr = item.data && item.data.abbr ? item.data.abbr : obj.filterText
  if (item.data && item.data.optional) {
    obj.abbr = obj.abbr + '?'
  }
  if (isSnippet) obj.abbr = obj.abbr + '~'
  let document = this.getDocumentation(item)
  if (document) obj.info = document
  // item.commitCharacters not necessary for vim
  return obj
}

function validString(str: any): boolean {
  if (typeof str !== 'string') return false
  return str.length > 0
}