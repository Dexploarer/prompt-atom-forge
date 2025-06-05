import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy, Globe, Link, Share2, Twitter } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface PromptSharingProps {
  promptId: string;
  trigger?: React.ReactNode;
}

const PromptSharing = ({ promptId, trigger }: PromptSharingProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  const shareUrl = `https://www.promptordie.tech/p/${promptId}`;
  const embedCode = `<iframe src="${shareUrl}/embed" width="100%" height="500" frameborder="0"></iframe>`;

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title: 'Copied!',
        description: `${type} copied to clipboard.`,
      });
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePublic = () => {
    setIsPublic(!isPublic);

    if (!isPublic) {
      toast({
        title: 'Prompt is now public',
        description: 'Anyone with the link can view this prompt.',
      });
    } else {
      toast({
        title: 'Prompt is now private',
        description: 'Only you can view this prompt.',
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'My Prompt or Die Prompt',
          text: 'Check out this prompt I created with Prompt or Die!',
          url: shareUrl,
        })
        .then(() => {
          toast({
            title: 'Shared!',
            description: 'Prompt shared successfully.',
          });
        })
        .catch(() => {
          toast({
            title: 'Share failed',
            description: 'Could not share the prompt.',
            variant: 'destructive',
          });
        });
    } else {
      handleCopy(shareUrl, 'Link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Your Prompt</DialogTitle>
          <DialogDescription>
            Share your prompt with others or embed it in your website.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Make prompt public</span>
            </div>
            <Switch checked={isPublic} onCheckedChange={handleTogglePublic} />
          </div>

          {isPublic ? (
            <>
              <Tabs defaultValue="link" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="link">Share Link</TabsTrigger>
                  <TabsTrigger value="embed">Embed</TabsTrigger>
                </TabsList>

                <TabsContent value="link" className="space-y-4 mt-4">
                  <div className="flex gap-2">
                    <Input value={shareUrl} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(shareUrl, 'Link')}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="flex justify-center gap-2 pt-4">
                    <Button onClick={handleShare} className="gap-1">
                      <Link className="h-4 w-4" />
                      Copy Link
                    </Button>
                    <Button variant="outline" className="gap-1">
                      <Twitter className="h-4 w-4" />
                      Share on Twitter
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="embed" className="space-y-4 mt-4">
                  <div className="relative">
                    <Label htmlFor="embed-code" className="text-xs mb-1 block">
                      Embed Code
                    </Label>
                    <textarea
                      id="embed-code"
                      className="w-full h-20 p-2 text-xs font-mono bg-muted rounded-md"
                      readOnly
                      value={embedCode}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-6"
                      onClick={() => handleCopy(embedCode, 'Embed code')}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>

                  <div className="border rounded-md p-4">
                    <Label className="text-xs mb-2 block">Preview</Label>
                    <div className="bg-muted aspect-video rounded flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Embed preview</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="bg-muted p-4 rounded-md text-center">
              <p className="text-muted-foreground text-sm">
                Make this prompt public to generate a shareable link or embed code.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromptSharing;
