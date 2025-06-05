import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, Globe, Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'active' | 'error';
  createdAt: string;
}

const DomainSettings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [links, setLinks] = useState<{ url: string; helpUrl: string } | null>(null);

  useEffect(() => {
    // Fetch user domains on component mount
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    // In a real application, this would fetch domains from an API
    // Here we're using mock data
    setDomains([
      {
        id: '1',
        domain: 'prompts.example.com',
        status: 'active',
        createdAt: '2025-03-15T12:00:00Z',
      },
      {
        id: '2',
        domain: 'ai.example.dev',
        status: 'pending',
        createdAt: '2025-03-18T14:30:00Z',
      },
    ]);
  };

  const handleAddDomain = async () => {
    if (!newDomain) {
      toast({
        title: 'Domain required',
        description: 'Please enter a domain name',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // This would use getEntriLinks in a real implementation
    try {
      // Here we would call getEntriLinks() to get custom domain links
      // For demonstration, we'll use mock data
      setTimeout(() => {
        const links = {
          url: `https://${newDomain}`,
          helpUrl: 'https://docs.promptordie.tech/domains',
        };
        setLinks(links);

        // Add domain to the list with pending status
        const newDomainObj: Domain = {
          id: Date.now().toString(),
          domain: newDomain,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        setDomains([...domains, newDomainObj]);
        setNewDomain('');
        setIsLoading(false);

        toast({
          title: 'Domain added',
          description: `${newDomain} has been added. DNS verification required.`,
        });
      }, 1500);
    } catch (error) {
      console.error('Error adding domain:', error);
      setIsLoading(false);
      toast({
        title: 'Error adding domain',
        description: 'There was a problem adding your domain',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveDomain = (id: string) => {
    setDomains(domains.filter(domain => domain.id !== id));
    toast({
      title: 'Domain removed',
      description: 'The domain has been removed from your account',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Domains</CardTitle>
        <CardDescription>Connect your own domain to your Prompt or Die workspace</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="domain">Domain Name</Label>
            <Input
              id="domain"
              placeholder="your-domain.com"
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
            />
          </div>
          <Button
            onClick={handleAddDomain}
            disabled={isLoading || !newDomain}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Domain
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Your Domains</h3>

          {domains.length === 0 ? (
            <div className="text-center p-4 border border-dashed rounded-md">
              <Globe className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No domains configured yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map(domain => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{domain.domain}</p>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            domain.status === 'active'
                              ? 'bg-green-500'
                              : domain.status === 'pending'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                        />
                        <p className="text-xs text-muted-foreground capitalize">{domain.status}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {domain.status === 'active' && (
                      <Button variant="outline" size="sm" className="h-8 gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Visit
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDomain(domain.id)}
                      className="h-8 hover:text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2">
        <p className="text-sm text-muted-foreground">
          Need help setting up your domain?{' '}
          <a href="https://docs.promptordie.tech/domains" className="text-primary underline">
            Read our guide
          </a>
        </p>
      </CardFooter>
    </Card>
  );
};

export default DomainSettings;
