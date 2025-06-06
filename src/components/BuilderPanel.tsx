
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Shuffle, Keyboard, PenTool } from 'lucide-react';
import { PromptBlockProps } from './PromptBlock';
import BlockList from './BlockList';

interface BuilderPanelProps {
  blocks: PromptBlockProps[];
  onAddBlock: () => void;
  onRemoveBlock: (id: string) => void;
  onUpdateBlock: (block: PromptBlockProps) => void;
  onDuplicateBlock: (block: PromptBlockProps) => void;
  onShuffleBlocks: () => void;
  onShowKeyboardHelp: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, dropIndex: number) => void;
  draggedIndex: number | null;
}

const BuilderPanel = ({
  blocks,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onDuplicateBlock,
  onShuffleBlocks,
  onShowKeyboardHelp,
  onDragStart,
  onDragOver,
  onDrop,
  draggedIndex
}: BuilderPanelProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 h-8 w-8 rounded-md flex items-center justify-center border border-primary/30">
            <PenTool className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Prompt Builder</h2>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onShuffleBlocks}
            className="border-muted hover:border-primary/50"
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onShowKeyboardHelp}
            className="border-muted hover:border-primary/50"
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>
          <Button 
            onClick={onAddBlock}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Block
          </Button>
        </div>
      </div>

      <Card className="border border-border/60 bg-card/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Prompt Blocks</CardTitle>
        </CardHeader>
        <CardContent>
          <BlockList
            blocks={blocks}
            onUpdateBlock={onUpdateBlock}
            onDeleteBlock={(block) => onRemoveBlock(block.id)}
            onDuplicateBlock={onDuplicateBlock}
            onRemove={(id) => onRemoveBlock(id)}
            onUpdate={onUpdateBlock}
            onDuplicate={onDuplicateBlock}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            draggedIndex={draggedIndex}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BuilderPanel;
