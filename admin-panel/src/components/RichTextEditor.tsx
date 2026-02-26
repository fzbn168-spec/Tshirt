'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { 
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, 
  Youtube as YoutubeIcon, Table as TableIcon, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Quote, Undo, Redo, Eraser, Baseline, Code, MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/button';
import { useState } from 'react';
import { FileUpload } from './FileUpload';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  if (!editor) {
    return null;
  }

  const addImage = (url: string) => {
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    setShowImageUpload(false);
  };

  const addYoutube = () => {
    if (youtubeUrl) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
      setYoutubeUrl('');
      setShowYoutubeInput(false);
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 p-2 flex flex-wrap items-center gap-1 bg-zinc-50 dark:bg-zinc-900/50">
      
      {/* Paragraph / Heading Dropdown */}
      <select
        className="h-8 rounded-md border border-zinc-200 bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 mr-2"
        onChange={(e) => {
           const val = e.target.value;
           if (val === 'p') editor.chain().focus().setParagraph().run();
           else if (val === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
           else if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
           else if (val === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
        }}
        value={
           editor.isActive('heading', { level: 1 }) ? 'h1' :
           editor.isActive('heading', { level: 2 }) ? 'h2' :
           editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'
        }
      >
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-1" />

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-zinc-200 dark:bg-zinc-800' : ''}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-zinc-200 dark:bg-zinc-800' : ''}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive('underline') ? 'bg-zinc-200 dark:bg-zinc-800' : ''}
        title="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      
      {/* Color (A) - Simplified as toggle for now or could be a picker */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().setColor('#958DF1').run()}
        className={editor.isActive('textStyle', { color: '#958DF1' }) ? 'bg-zinc-200 dark:bg-zinc-800' : ''}
        title="Text Color"
      >
        <Baseline className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-1" />

      {/* Alignment */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={editor.isActive({ textAlign: 'left' }) ? 'bg-zinc-200 dark:bg-zinc-800' : ''}
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={editor.isActive({ textAlign: 'center' }) ? 'bg-zinc-200 dark:bg-zinc-800' : ''}
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={editor.isActive({ textAlign: 'right' }) ? 'bg-zinc-200 dark:bg-zinc-800' : ''}
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-1" />

      <Button
        size="sm"
        variant="ghost"
        onClick={setLink}
        className={editor.isActive('link') ? 'bg-zinc-200 dark:bg-zinc-800' : ''}
        title="Link"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      
      <div className="relative">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowImageUpload(!showImageUpload)}
          className={showImageUpload ? 'bg-zinc-200 dark:bg-zinc-800' : ''}
          title="Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        {showImageUpload && (
          <div className="absolute top-full left-0 z-50 mt-2 w-64 p-2 bg-white dark:bg-zinc-900 border rounded-lg shadow-xl">
            <FileUpload onUpload={addImage} label="Upload Image" className="h-32" />
          </div>
        )}
      </div>

      <div className="relative">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowYoutubeInput(!showYoutubeInput)}
          className={showYoutubeInput ? 'bg-zinc-200 dark:bg-zinc-800' : ''}
          title="Youtube"
        >
          <YoutubeIcon className="h-4 w-4" />
        </Button>
        {showYoutubeInput && (
          <div className="absolute top-full left-0 z-50 mt-2 w-64 p-2 bg-white dark:bg-zinc-900 border rounded-lg shadow-xl flex gap-2">
            <input
              className="flex-1 px-2 py-1 text-sm border rounded"
              placeholder="Youtube URL"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
            />
            <Button size="sm" onClick={addYoutube}>Add</Button>
          </div>
        )}
      </div>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Table"
      >
        <TableIcon className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-1" />
      
      <Button
        size="sm"
        variant="ghost"
        title="More"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive('codeBlock') ? 'bg-zinc-200 dark:bg-zinc-800' : ''}
        title="Code"
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="flex-1" />

      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Youtube.configure({
        controls: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden bg-white dark:bg-zinc-900">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}