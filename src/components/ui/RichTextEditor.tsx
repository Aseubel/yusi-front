import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from './Button'
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote, Heading1, Heading2, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '../../utils'
import { useImageUpload } from '../../hooks/useImageUpload'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  userId?: string
  onImagesChange?: (objectKeys: string[]) => void
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

export const RichTextEditor = ({ value, onChange, placeholder, className, disabled, userId, onImagesChange }: RichTextEditorProps) => {
  const { upload, uploading } = useImageUpload({
    userId: userId || '',
    onSuccess: (response) => {
      onImagesChange?.([response.objectKey]);
    },
  });

  const uploadImageToOss = async (file: File): Promise<string | null> => {
    const response = await upload(file);
    return response?.url || null;
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-md max-w-full my-4',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-4 [&>img]:rounded-md [&>img]:max-w-full [&>img]:my-4',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0]
          if (file.type.startsWith('image/')) {
            uploadImageToOss(file).then(url => {
              if (url) {
                const { schema } = view.state
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
                if (coordinates) {
                    view.dispatch(view.state.tr.insert(coordinates.pos, schema.nodes.image.create({ src: url })))
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
                uploadImageToOss(file).then(url => {
                  if (url) {
                     const { schema } = view.state
                     view.dispatch(view.state.tr.replaceSelectionWith(schema.nodes.image.create({ src: url })))
                  }
                })
                return true
            }
        }
        return false
      }
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
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
        const url = await uploadImageToOss(file)
        if (url) {
          editor.chain().focus().setImage({ src: url }).run()
        }
      }
    }
    input.click()
  }

  return (
    <div className={cn("border rounded-md bg-background", className)}>
      <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-muted/30">
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
}
