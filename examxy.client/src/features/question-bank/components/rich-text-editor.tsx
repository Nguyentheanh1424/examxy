import { mergeAttributes, Node, nodeInputRule, type JSONContent } from '@tiptap/core'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  BookImage,
  Sigma,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { BlockMath, InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'

import { Button } from '@/components/ui/button'
import type { RichContentDocument } from '@/types/question-bank'

export function documentToTiptap(doc: RichContentDocument): JSONContent {
  return {
    type: 'doc',
    content: doc.blocks.map((block) => {
      if (block.type === 'paragraph') {
        return {
          type: 'paragraph',
          content: block.inline?.map((node) => {
            if (node.type === 'mathInline') {
              return { type: 'mathInline', attrs: { latex: node.latex ?? '' } }
            }
            return { type: 'text', text: node.text ?? node.value ?? '' }
          }) || [],
        }
      }
      if (block.type === 'mathBlock') {
        return {
          type: 'mathBlock',
          attrs: { latex: block.latex ?? '' },
        }
      }
      if (block.type === 'image') {
        return {
          type: 'image',
          attrs: {
            attachmentId: block.attachmentId,
            altText: block.altText || '',
            caption: block.caption || '',
          },
        }
      }
      return null
    }).filter(Boolean) as JSONContent[],
  }
}

export function tiptapToDocument(json: JSONContent): RichContentDocument {
  const blocks: RichContentDocument['blocks'] = []
  
  if (json.content) {
    json.content.forEach((node) => {
      if (node.type === 'paragraph') {
        const inline: any[] = []
        if (node.content) {
          node.content.forEach((child) => {
            if (child.type === 'mathInline') {
              inline.push({ type: 'mathInline', latex: child.attrs?.latex || '' })
            } else if (child.type === 'text') {
              inline.push({ type: 'text', text: child.text || '' })
            }
          })
        }
        blocks.push({ type: 'paragraph', inline })
      } else if (node.type === 'mathBlock') {
        blocks.push({ type: 'mathBlock', latex: node.attrs?.latex || '' })
      } else if (node.type === 'image') {
        blocks.push({
          type: 'image',
          attachmentId: node.attrs?.attachmentId,
          altText: node.attrs?.altText,
          caption: node.attrs?.caption,
        })
      }
    })
  }

  return {
    schemaVersion: 2,
    blocks,
  }
}

function MathNodeView(props: NodeViewProps) {
  const { node, updateAttributes } = props
  const { latex } = node.attrs
  const [isEditing, setIsEditing] = useState(false)
  const isInline = node.type.name === 'mathInline'

  if (isEditing) {
    return (
      <NodeViewWrapper
        as={isInline ? 'span' : 'div'}
        className={isInline ? 'inline-block align-middle' : 'my-4 block'}
      >
        <div className="flex flex-col gap-2 rounded-lg border border-brand bg-brand-soft/20 p-2 shadow-sm">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-strong">
              Sửa {isInline ? 'công thức' : 'khối toán'}
            </span>
            <button
              className="rounded p-0.5 hover:bg-brand/20"
              onClick={() => setIsEditing(false)}
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
          <input
            autoFocus
            className="w-full rounded border border-brand/30 bg-surface px-2 py-1.5 text-sm font-medium text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            onBlur={() => setIsEditing(false)}
            onChange={(e) => updateAttributes({ latex: e.target.value })}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') {
                e.preventDefault()
                setIsEditing(false)
              }
            }}
            placeholder="Nhập LaTeX..."
            value={latex}
          />
          <div className="rounded border border-brand/10 bg-white/60 p-2 text-center">
            <div className="text-[9px] font-semibold text-muted mb-1 uppercase">Preview</div>
            <div className="text-brand-strong min-h-[1.5em] flex items-center justify-center">
              {isInline ? (
                <InlineMath math={latex || ' '} renderError={() => <span className="text-xs text-danger">Lỗi LaTeX</span>} />
              ) : (
                <BlockMath math={latex || ' '} renderError={() => <span className="text-xs text-danger">Lỗi LaTeX</span>} />
              )}
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper
      as={isInline ? 'span' : 'div'}
      className={`cursor-pointer rounded transition hover:ring-2 hover:ring-brand ${isInline ? 'mx-1 inline-block' : 'my-2 block text-center'}`}
      onClick={() => setIsEditing(true)}
    >
      {isInline ? (
        <span className="rounded bg-brand-soft/30 px-1 text-brand-strong">
          <InlineMath math={latex} renderError={(e) => <code className="text-danger-strong">{e.message}</code>} />
        </span>
      ) : (
        <div className="rounded border border-dashed border-line bg-surface-alt/30 py-2 text-brand-strong">
          <BlockMath math={latex} renderError={(e) => <code className="text-danger-strong">{e.message}</code>} />
        </div>
      )}
    </NodeViewWrapper>
  )
}

const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() {
    return { latex: { default: '' } }
  },
  parseHTML() {
    return [{ tag: 'math-inline' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['math-inline', mergeAttributes(HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView)
  },
  addInputRules() {
    return [
      nodeInputRule({
        find: /\\\((.*?)\\\)$/,
        type: this.type,
        getAttributes: (match) => ({ latex: match[1] }),
      }),
    ]
  },
})

const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  addAttributes() {
    return { latex: { default: '' } }
  },
  parseHTML() {
    return [{ tag: 'math-block' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['math-block', mergeAttributes(HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView)
  },
  addInputRules() {
    return [
      nodeInputRule({
        find: /\\\[(.*?)\\\]$/,
        type: this.type,
        getAttributes: (match) => ({ latex: match[1] }),
      }),
    ]
  },
})

const ImageNode = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      attachmentId: { default: null },
      altText: { default: '' },
      caption: { default: '' },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="image"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image' })]
  },
  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => {
      const { attachmentId, caption } = props.node.attrs
      return (
        <NodeViewWrapper className="my-4 block">
          <figure className="rounded-[var(--radius-input)] border border-line bg-surface p-3">
            <div className="flex h-32 flex-col items-center justify-center rounded-[var(--radius-input)] bg-surface-alt text-muted">
              <BookImage className="mb-2 size-6" />
              <p className="text-xs font-medium">Hình ảnh đính kèm: {attachmentId || 'N/A'}</p>
            </div>
            {caption ? (
              <figcaption className="mt-2 text-center text-sm text-muted">{caption}</figcaption>
            ) : (
              <div className="mt-2 text-center text-[10px] italic text-muted/60">Không có chú thích</div>
            )}
          </figure>
        </NodeViewWrapper>
      )
    })
  },
})

export function RichContentEditor({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: RichContentDocument
  onChange: (document: RichContentDocument) => void
  placeholder?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Nhập nội dung...',
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-muted before:float-left before:pointer-events-none before:h-0',
      }),
      MathInline,
      MathBlock,
      ImageNode,
    ],
    content: documentToTiptap(value),
    onUpdate: ({ editor }) => {
      onChange(tiptapToDocument(editor.getJSON()))
    },
  })

  useEffect(() => {
    if (editor && value) {
      const currentJson = JSON.stringify(editor.getJSON())
      const nextJson = JSON.stringify(documentToTiptap(value))
      if (currentJson !== nextJson) {
        editor.commands.setContent(documentToTiptap(value))
      }
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <section className="space-y-3">
      <div>
        <p className="text-base font-semibold text-ink">{label}</p>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-input)] border border-line bg-surface focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
        <textarea
          aria-label={label}
          className="sr-only"
          onChange={(event) => onChange(parseRichContentSource(event.target.value))}
          tabIndex={-1}
          value={documentToSource(value)}
        />
        <EditorContent
          className="prose prose-sm prose-slate max-w-none px-4 py-3 text-base leading-7 text-ink outline-none [&>.ProseMirror]:min-h-[8rem] [&>.ProseMirror]:outline-none"
          editor={editor}
        />
        <div className="flex flex-wrap gap-2 border-t border-line bg-surface-alt/55 px-3 py-2">
          <Button
            leftIcon={<Sigma className="size-4" />}
            onClick={() => {
              const latex = window.prompt('Nhập công thức (ví dụ: x^2 + 1)', 'x^2 + 1')
              if (latex) {
                editor.chain().focus().insertContent({ type: 'mathInline', attrs: { latex } }).run()
              }
            }}
            type="button"
            variant="secondary"
          >
            Chèn công thức
          </Button>
          <Button
            leftIcon={<Sigma className="size-4" />}
            onClick={() => {
              const latex = window.prompt('Nhập công thức dòng riêng', 'x^2 + 1')
              if (latex) {
                editor.chain().focus().insertContent({ type: 'mathBlock', attrs: { latex } }).run()
              }
            }}
            type="button"
            variant="secondary"
          >
            Công thức dòng riêng
          </Button>
        </div>
      </div>
    </section>
  )
}

function documentToSource(document: RichContentDocument): string {
  return document.blocks.map((block) => {
    if (block.type === 'paragraph') {
      return block.inline?.map((node) => {
        if (node.type === 'mathInline') return `\\(${node.latex ?? ''}\\)`
        return node.text ?? node.value ?? ''
      }).join('') ?? ''
    }
    if (block.type === 'mathBlock') {
      return `\\[\n${block.latex ?? ''}\n\\]`
    }
    return ''
  }).filter(Boolean).join('\n\n')
}

function parseRichContentSource(source: string): RichContentDocument {
  const blocks: RichContentDocument['blocks'] = []
  const blockPattern = /\\\[((?:.|\n)*?)\\\]/g
  let cursor = 0

  source.replace(blockPattern, (match, latex: string, offset: number) => {
    appendParagraphBlocks(blocks, source.slice(cursor, offset))
    if (latex.trim()) blocks.push({ type: 'mathBlock', latex: latex.trim() })
    cursor = offset + match.length
    return match
  })
  appendParagraphBlocks(blocks, source.slice(cursor))

  return { schemaVersion: 2, blocks }
}

function appendParagraphBlocks(blocks: RichContentDocument['blocks'], source: string) {
  source.split(/\n{2,}/).map(p => p.trim()).filter(Boolean).forEach(paragraph => {
    blocks.push({ type: 'paragraph', inline: parseInlineNodes(paragraph) })
  })
}

function parseInlineNodes(source: string) {
  const nodes: NonNullable<RichContentDocument['blocks'][number]['inline']> = []
  const inlinePattern = /\\\((.*?)\\\)/g
  let cursor = 0

  source.replace(inlinePattern, (match, latex: string, offset: number) => {
    if (offset > cursor) nodes.push({ type: 'text', text: source.slice(cursor, offset) })
    if (latex.trim()) nodes.push({ type: 'mathInline', latex: latex.trim() })
    cursor = offset + match.length
    return match
  })

  if (cursor < source.length) nodes.push({ type: 'text', text: source.slice(cursor) })
  return nodes
}
