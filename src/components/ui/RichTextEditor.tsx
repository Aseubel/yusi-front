import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import Paragraph from '@tiptap/extension-paragraph'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from './Button'
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote, Heading1, Heading2, Image as ImageIcon, Loader2 } from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '../../utils'
import { useImageUpload } from '../../hooks/useImageUpload'
import type { ImageUploadResponse } from '../../lib/api'
import type { DiaryAttachmentAnchor } from '../../lib/diaryAttachments'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  userId?: string
  onImagesChange?: (image: Pick<ImageUploadResponse, 'objectKey' | 'url'>) => void
}

export interface RichTextEditorHandle {
  getOrCreateActiveParagraphId: () => string | null
  getActiveTextAnchor: () => { paragraphId: string; anchor: DiaryAttachmentAnchor } | null
  insertTextAtSelection: (text: string) => void
}

const ManagedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      objectKey: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-object-key'),
        renderHTML: (attributes: { objectKey?: string | null }) => {
          if (!attributes.objectKey) return {}
          return { 'data-object-key': attributes.objectKey }
        },
      },
    }
  },
})

const ManagedParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      paragraphId: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-paragraph-id'),
        renderHTML: (attributes: { paragraphId?: string | null }) => {
          if (!attributes.paragraphId) return {}
          return { 'data-paragraph-id': attributes.paragraphId }
        },
      },
    }
  },
})

const createParagraphId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `p-${crypto.randomUUID()}`
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const ToolbarButton = ({
  isActive,
  onClick,
  disabled,
  children
}: {
  isActive: boolean
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) => (
  <Button
    variant="ghost"
    size="icon"
    onClick={(e) => {
      e.preventDefault()
      onClick()
    }}
    disabled={disabled}
    className={cn(
      "h-8 w-8",
      isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
    )}
  >
    {children}
  </Button>
)

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(({ value, onChange, placeholder, className, disabled, userId, onImagesChange }, ref) => {
  const lastSyncedValue = useRef<string | null>(null)
  const { upload, uploading } = useImageUpload({
    userId: userId || '',
    onSuccess: (response) => {
      onImagesChange?.({ objectKey: response.objectKey, url: response.url });
    },
  });

  const uploadImageToOss = async (file: File): Promise<ImageUploadResponse | null> => {
    return upload(file);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ paragraph: false }),
      ManagedParagraph,
      Underline,
      ManagedImage.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-4 border border-border/60 shadow-sm',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const nextValue = editor.getHTML()
      lastSyncedValue.current = nextValue
      onChange(nextValue)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[180px] p-4 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:border [&_img]:border-border/60 [&_img]:shadow-sm',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0]
          if (file.type.startsWith('image/')) {
            uploadImageToOss(file).then(response => {
              if (response) {
                const { schema } = view.state
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
                if (coordinates) {
                    view.dispatch(view.state.tr.insert(coordinates.pos, schema.nodes.image.create({
                      src: response.url,
                      objectKey: response.objectKey,
                    })))
                }
              }
            })
            return true
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || [])
        const item = items.find(item => item.type.startsWith('image/'))
        if (item) {
            const file = item.getAsFile()
            if (file) {
                uploadImageToOss(file).then(response => {
                  if (response) {
                     const { schema } = view.state
                     view.dispatch(view.state.tr.replaceSelectionWith(schema.nodes.image.create({
                       src: response.url,
                       objectKey: response.objectKey,
                     })))
                  }
                })
                return true
            }
        }
        return false
      }
    },
  })

  useImperativeHandle(ref, () => ({
    getOrCreateActiveParagraphId: () => {
      if (!editor || editor.isDestroyed) return null

      const { $from } = editor.state.selection
      for (let depth = $from.depth; depth > 0; depth -= 1) {
        const node = $from.node(depth)
        if (node.type.name !== 'paragraph') continue

        const paragraphId = node.attrs.paragraphId || createParagraphId()
        if (!node.attrs.paragraphId) {
          const position = $from.before(depth)
          editor.view.dispatch(editor.state.tr.setNodeMarkup(position, undefined, {
            ...node.attrs,
            paragraphId,
          }))
        }
        return paragraphId
      }
      return null
    },
    getActiveTextAnchor: () => {
      if (!editor || editor.isDestroyed) return null

      const { $from, $to, from, to } = editor.state.selection
      if (from === to) return null

      let paragraphDepth = -1
      for (let depth = $from.depth; depth > 0; depth -= 1) {
        if ($from.node(depth).type.name === 'paragraph') {
          paragraphDepth = depth
          break
        }
      }
      if (paragraphDepth < 0 || $from.before(paragraphDepth) !== $to.before(paragraphDepth)) return null

      const paragraph = $from.node(paragraphDepth)
      const paragraphId = paragraph.attrs.paragraphId || createParagraphId()
      if (!paragraph.attrs.paragraphId) {
        const position = $from.before(paragraphDepth)
        editor.view.dispatch(editor.state.tr.setNodeMarkup(position, undefined, {
          ...paragraph.attrs,
          paragraphId,
        }))
      }

      const paragraphStart = $from.start(paragraphDepth)
      const start = from - paragraphStart
      const end = to - paragraphStart
      const quote = paragraph.textBetween(start, end, '\n', '\uFFFC')
      if (!quote.trim()) return null

      return {
        paragraphId,
        anchor: {
          kind: 'TEXT_RANGE',
          start,
          end,
          quote,
          prefix: paragraph.textBetween(Math.max(0, start - 32), start, '\n', '\uFFFC'),
          suffix: paragraph.textBetween(end, Math.min(paragraph.content.size, end + 32), '\n', '\uFFFC'),
        },
      }
    },
    insertTextAtSelection: (text: string) => {
      if (!editor || editor.isDestroyed || !text) return
      editor.chain().focus().insertContent(text).run()
    },
  }), [editor])

  useEffect(() => {
    if (!editor || editor.isDestroyed || value === lastSyncedValue.current) return

    editor.commands.setContent(value, { emitUpdate: false })
    lastSyncedValue.current = value
  }, [value, editor])

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [disabled, editor])

  if (!editor) {
    return null
  }

  const addImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        const response = await uploadImageToOss(file)
        if (response) {
          editor.chain().focus().insertContent({
            type: 'image',
            attrs: {
              src: response.url,
              objectKey: response.objectKey,
            },
          }).run()
        }
      }
    }
    input.click()
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-muted/30 p-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarButton
          onClick={addImage}
          isActive={false}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
})

RichTextEditor.displayName = 'RichTextEditor'
