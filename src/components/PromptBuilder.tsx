
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { PromptBlockProps } from "./PromptBlock";
import KeyboardShortcuts from "./KeyboardShortcuts";
import BuilderPanel from "./BuilderPanel";
import PreviewPanel from "./PreviewPanel";

interface PromptBuilderProps {
  initialBlocks?: PromptBlockProps[];
  onBlocksChange?: (blocks: PromptBlockProps[]) => void;
}

const PromptBuilder = ({ initialBlocks = [], onBlocksChange }: PromptBuilderProps) => {
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<PromptBlockProps[]>(initialBlocks);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (onBlocksChange) {
      onBlocksChange(blocks);
    }
  }, [blocks, onBlocksChange]);

  const addBlock = (type: 'intent' | 'tone' | 'format' | 'context' | 'persona' = 'intent') => {
    const newBlock: PromptBlockProps = {
      id: Math.random().toString(36).substring(2, 15),
      type,
      label: `New ${type}`,
      value: ''
    };
    
    setBlocks([...blocks, newBlock]);
    
    toast({
      title: "Block added",
      description: `${type} block has been added to your prompt`
    });
  };

  const updateBlock = (id: string, updates: Partial<PromptBlockProps>) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
    
    toast({
      title: "Block deleted",
      description: "Block has been removed from your prompt"
    });
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    if (movedBlock) {
      newBlocks.splice(toIndex, 0, movedBlock);
      setBlocks(newBlocks);
    }
  };

  const duplicateBlock = (id: string) => {
    const blockToDuplicate = blocks.find(block => block.id === id);
    if (blockToDuplicate) {
      const duplicatedBlock: PromptBlockProps = {
        ...blockToDuplicate,
        id: Math.random().toString(36).substring(2, 15),
        label: `${blockToDuplicate.label} (Copy)`
      };
      
      const blockIndex = blocks.findIndex(block => block.id === id);
      const newBlocks = [...blocks];
      newBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
      setBlocks(newBlocks);
      
      toast({
        title: "Block duplicated",
        description: "Block has been duplicated successfully"
      });
    }
  };

  const generatePrompt = () => {
    return blocks.map(block => {
      switch (block.type) {
        case 'intent':
          return `Intent: ${block.value}`;
        case 'tone':
          return `Tone: ${block.value}`;
        case 'format':
          return `Format: ${block.value}`;
        case 'context':
          return `Context: ${block.value}`;
        case 'persona':
          return `Persona: ${block.value}`;
        default:
          return block.value;
      }
    }).join('\n\n');
  };

  const shuffleBlocks = () => {
    const shuffled = [...blocks].sort(() => Math.random() - 0.5);
    setBlocks(shuffled);
    toast({
      title: "Blocks shuffled",
      description: "Block order has been randomized"
    });
  };

  const copyToClipboard = async () => {
    const prompt = generatePrompt();
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Prompt has been copied to your clipboard"
    });
  };

  const showKeyboardHelp = () => {
    toast({
      title: "Keyboard Shortcuts",
      description: "⌘+N: Add Block | ⌘+Enter: Generate | ⌘+Shift+C: Copy | ⌘+E: Export"
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null) {
      moveBlock(draggedIndex, dropIndex);
      setDraggedIndex(null);
    }
  };

  // Handler functions that match the expected signatures
  const handleAddBlock = () => {
    addBlock();
  };

  const handleUpdateBlock = (block: PromptBlockProps) => {
    setBlocks(blocks.map(b => 
      b.id === block.id ? block : b
    ));
  };

  const handleDeleteBlock = (block: PromptBlockProps) => {
    setBlocks(blocks.filter(b => b.id !== block.id));
    toast({
      title: "Block deleted",
      description: "Block has been removed from your prompt"
    });
  };

  const handleDuplicateBlock = (block: PromptBlockProps) => {
    const duplicatedBlock: PromptBlockProps = {
      ...block,
      id: Math.random().toString(36).substring(2, 15),
      label: `${block.label} (Copy)`
    };
    
    const blockIndex = blocks.findIndex(b => b.id === block.id);
    const newBlocks = [...blocks];
    newBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
    setBlocks(newBlocks);
    
    toast({
      title: "Block duplicated",
      description: "Block has been duplicated successfully"
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="flex-1">
        <BuilderPanel 
          blocks={blocks}
          onAddBlock={handleAddBlock}
          onRemoveBlock={deleteBlock}
          onUpdateBlock={handleUpdateBlock}
          onDuplicateBlock={handleDuplicateBlock}
          onShuffleBlocks={shuffleBlocks}
          onShowKeyboardHelp={showKeyboardHelp}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          draggedIndex={draggedIndex}
        />
      </div>
      
      <div className="flex-1">
        <PreviewPanel 
          generatedPrompt={generatePrompt()}
          blockCount={blocks.length}
          copied={copied}
          onCopyToClipboard={copyToClipboard}
        />
      </div>
      
      <KeyboardShortcuts 
        onAddBlock={handleAddBlock}
        onGeneratePrompt={() => generatePrompt()}
        onCopyPrompt={copyToClipboard}
        onExportPrompt={() => {}}
      />
    </div>
  );
};

export default PromptBuilder;
