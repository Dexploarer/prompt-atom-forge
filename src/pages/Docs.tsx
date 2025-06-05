import { useState } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Check, Copy, ExternalLink, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Docs = () => {
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);

    setCopyStatus({ ...copyStatus, [id]: true });
    setTimeout(() => {
      setCopyStatus({ ...copyStatus, [id]: false });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-4xl font-bold">Documentation</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about building modular prompts with Prompt or Die
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search documentation..." className="pl-10 h-12" />
          </div>

          <Tabs defaultValue="getting-started">
            <TabsList className="w-full justify-start overflow-auto mb-6">
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="block-types">Block Types</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="getting-started" className="space-y-8">
              <section className="space-y-4">
                <h2 className="text-2xl font-bold">What is Prompt or Die?</h2>
                <p>
                  Prompt or Die is a visual AI prompt builder that allows you to design prompts like
                  design systems. Build modular AI prompts with drag-and-drop blocks, preview in
                  real-time, and export to any agent framework.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <Card className="flex-1">
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-2">Modular Blocks</h3>
                      <p className="text-muted-foreground">
                        Create prompts from reusable, composable building blocks
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="flex-1">
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-2">Real-time Preview</h3>
                      <p className="text-muted-foreground">
                        See AI responses as you build with Bolt SDK integration
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="flex-1">
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-2">Export Anywhere</h3>
                      <p className="text-muted-foreground">
                        Use your prompts in any LLM platform or agent system
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-bold">Quick Start Guide</h2>
                <ol className="list-decimal list-inside space-y-4">
                  <li className="pl-2">
                    <strong>Create your first prompt</strong>
                    <p className="text-muted-foreground mt-1 ml-6">
                      Start with a blank canvas or choose a template from our gallery
                    </p>
                  </li>
                  <li className="pl-2">
                    <strong>Add prompt blocks</strong>
                    <p className="text-muted-foreground mt-1 ml-6">
                      Choose from Intent, Tone, Format, Context, and Persona blocks to build your
                      prompt
                    </p>
                  </li>
                  <li className="pl-2">
                    <strong>Rearrange and customize</strong>
                    <p className="text-muted-foreground mt-1 ml-6">
                      Drag and drop blocks to rearrange them, edit content to customize your prompt
                    </p>
                  </li>
                  <li className="pl-2">
                    <strong>Generate and preview</strong>
                    <p className="text-muted-foreground mt-1 ml-6">
                      Generate your final prompt and see a live preview of the AI's response
                    </p>
                  </li>
                  <li className="pl-2">
                    <strong>Export and share</strong>
                    <p className="text-muted-foreground mt-1 ml-6">
                      Export your prompt to use in your favorite AI platforms or share with others
                    </p>
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Basic Example</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="relative font-mono text-sm bg-muted p-4 rounded-md overflow-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2"
                        onClick={() =>
                          handleCopy(
                            `## INTENT: Summarize Article
Provide a concise summary of the given article, highlighting key points and main ideas.

## TONE: Professional
Use clear, straightforward language appropriate for a business or academic context.

## FORMAT: Bullet Points
Format the output as a list of bullet points for easy scanning.`,
                            'example1',
                          )
                        }
                      >
                        {copyStatus['example1'] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <pre>{`## INTENT: Summarize Article
Provide a concise summary of the given article, highlighting key points and main ideas.

## TONE: Professional
Use clear, straightforward language appropriate for a business or academic context.

## FORMAT: Bullet Points
Format the output as a list of bullet points for easy scanning.`}</pre>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      This simple prompt combines an intent block (what to do), a tone block (how to
                      sound), and a format block (how to present the output).
                    </p>
                  </CardContent>
                </Card>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Keyboard Shortcuts</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-y-2">
                      <div className="font-mono text-sm">⌘+N</div>
                      <div>Add new block</div>
                      <div className="font-mono text-sm">⌘+Enter</div>
                      <div>Generate prompt</div>
                      <div className="font-mono text-sm">⌘+Shift+C</div>
                      <div>Copy generated prompt</div>
                      <div className="font-mono text-sm">⌘+E</div>
                      <div>Export prompt</div>
                      <div className="font-mono text-sm">⌘+/</div>
                      <div>Show keyboard shortcuts</div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            <TabsContent value="block-types" className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-6">Understanding Block Types</h2>
                <p className="mb-6">
                  Prompt or Die uses a modular approach to prompt engineering with five fundamental
                  block types. Each serves a specific purpose in crafting effective prompts for AI
                  systems.
                </p>

                <div className="grid gap-6 mt-8">
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-2 text-primary">Intent Blocks</h3>
                      <p className="mb-3">
                        Intent blocks define <strong>what</strong> the AI should do. They specify
                        the goal, task, or objective.
                      </p>
                      <div className="bg-muted p-3 rounded-md text-sm font-mono mb-4">
                        Provide a detailed analysis of the following code snippet, identifying
                        potential bugs and performance issues.
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use intent blocks to clearly state what you want the AI to accomplish.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-accent">
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-2 text-accent">Tone Blocks</h3>
                      <p className="mb-3">
                        Tone blocks define <strong>how</strong> the AI should communicate. They set
                        the voice, mood, and style.
                      </p>
                      <div className="bg-muted p-3 rounded-md text-sm font-mono mb-4">
                        Use a professional, technical tone appropriate for experienced developers.
                        Be thorough but concise.
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Tone blocks help ensure the AI's response matches the desired communication
                        style.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-2 text-yellow-500">Format Blocks</h3>
                      <p className="mb-3">
                        Format blocks define <strong>how</strong> the response should be structured
                        and presented.
                      </p>
                      <div className="bg-muted p-3 rounded-md text-sm font-mono mb-4">
                        Structure your response in the following format: 1. Summary of issues (1-2
                        sentences) 2. Bugs identified (bullet points) 3. Performance concerns
                        (numbered list) 4. Suggested improvements (code examples)
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Format blocks ensure information is organized in a way that's easy to
                        consume.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-2 text-purple-500">Context Blocks</h3>
                      <p className="mb-3">
                        Context blocks provide <strong>background</strong> information or
                        constraints for the AI to consider.
                      </p>
                      <div className="bg-muted p-3 rounded-md text-sm font-mono mb-4">
                        This code will be deployed in a high-traffic e-commerce application where
                        performance is critical. The team uses TypeScript and React best practices.
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Context blocks give the AI important information about the situation or
                        requirements.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-pink-500">
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-2 text-pink-500">Persona Blocks</h3>
                      <p className="mb-3">
                        Persona blocks define <strong>who</strong> the AI should emulate or what
                        role it should play.
                      </p>
                      <div className="bg-muted p-3 rounded-md text-sm font-mono mb-4">
                        Respond as a senior software architect with 15+ years of experience in
                        building scalable web applications.
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Persona blocks help shape the AI's approach, expertise level, and
                        perspective.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Combining Block Types</h2>
                <p className="mb-6">
                  The power of Prompt or Die comes from combining different block types to create
                  sophisticated, nuanced prompts that produce exactly the output you need.
                </p>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-semibold mb-4">Best Practices</h3>

                    <ul className="space-y-3">
                      <li className="flex gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>
                          <strong>Start with intent</strong> - Clearly define what you want the AI
                          to do
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>
                          <strong>Be specific about format</strong> - How should the information be
                          structured?
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>
                          <strong>Provide relevant context</strong> - Give background information
                          when needed
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>
                          <strong>Use personas</strong> for specialized knowledge or expertise
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>
                          <strong>Consider tone</strong> for the right style and audience
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            <TabsContent value="templates" className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-6">Working with Templates</h2>
                <p className="mb-6">
                  Templates provide a starting point for common prompt patterns. They can save time
                  and help ensure you're following best practices for specific use cases.
                </p>

                <div className="space-y-6">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-4">Using Templates</h3>
                      <ol className="list-decimal list-inside space-y-3">
                        <li className="pl-2">
                          <strong>Navigate to Templates</strong>
                          <p className="text-muted-foreground mt-1 ml-6">
                            Click on the Templates tab in the main dashboard
                          </p>
                        </li>
                        <li className="pl-2">
                          <strong>Browse by Category</strong>
                          <p className="text-muted-foreground mt-1 ml-6">
                            Templates are organized by use case (Content, Development, Creative,
                            etc.)
                          </p>
                        </li>
                        <li className="pl-2">
                          <strong>Preview and Load</strong>
                          <p className="text-muted-foreground mt-1 ml-6">
                            Click "Use Template" to load it into the Builder
                          </p>
                        </li>
                        <li className="pl-2">
                          <strong>Customize</strong>
                          <p className="text-muted-foreground mt-1 ml-6">
                            Edit blocks to customize the template for your specific needs
                          </p>
                        </li>
                      </ol>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-4">Creating Your Own Templates</h3>
                      <p className="mb-4">
                        Once you've created a prompt that works well, you can save it as a template
                        for future use.
                      </p>
                      <div className="bg-muted/50 p-4 rounded-md border border-border">
                        <p className="text-sm text-muted-foreground">
                          <strong>Coming Soon:</strong> The ability to save your own templates and
                          share them with the community.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Popular Template Examples</h2>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Content Summarizer</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          A template for creating concise summaries of long-form content
                        </p>
                        <div className="relative font-mono text-sm bg-muted p-4 rounded-md overflow-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2"
                            onClick={() =>
                              handleCopy(
                                `## INTENT: Summarize Content
Provide a concise summary of the given content, highlighting key points and main ideas.

## TONE: Professional
Use clear, professional language suitable for business communications.

## FORMAT: Bullet Points
Format the output as organized bullet points with clear hierarchy.`,
                                'template1',
                              )
                            }
                          >
                            {copyStatus['template1'] ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <pre>{`## INTENT: Summarize Content
Provide a concise summary of the given content, highlighting key points and main ideas.

## TONE: Professional
Use clear, professional language suitable for business communications.

## FORMAT: Bullet Points
Format the output as organized bullet points with clear hierarchy.`}</pre>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger>Code Reviewer</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          A template for analyzing code and providing improvement suggestions
                        </p>
                        <div className="relative font-mono text-sm bg-muted p-4 rounded-md overflow-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2"
                            onClick={() =>
                              handleCopy(
                                `## INTENT: Code Analysis
Review the provided code for potential improvements, bugs, and adherence to best practices.

## PERSONA: Senior Developer
Act as an experienced senior developer with expertise in multiple programming languages.

## FORMAT: Structured Review
Organize feedback into categories: Issues, Improvements, Best Practices, and Overall Assessment.`,
                                'template2',
                              )
                            }
                          >
                            {copyStatus['template2'] ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <pre>{`## INTENT: Code Analysis
Review the provided code for potential improvements, bugs, and adherence to best practices.

## PERSONA: Senior Developer
Act as an experienced senior developer with expertise in multiple programming languages.

## FORMAT: Structured Review
Organize feedback into categories: Issues, Improvements, Best Practices, and Overall Assessment.`}</pre>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>Creative Writer</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          A template for generating engaging creative content
                        </p>
                        <div className="relative font-mono text-sm bg-muted p-4 rounded-md overflow-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2"
                            onClick={() =>
                              handleCopy(
                                `## INTENT: Creative Writing
Create engaging, original creative content based on the given prompt or theme.

## TONE: Imaginative
Use vivid imagery, creative metaphors, and engaging storytelling techniques.

## CONTEXT: Target Audience
Consider the intended audience and adjust complexity and themes accordingly.`,
                                'template3',
                              )
                            }
                          >
                            {copyStatus['template3'] ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <pre>{`## INTENT: Creative Writing
Create engaging, original creative content based on the given prompt or theme.

## TONE: Imaginative
Use vivid imagery, creative metaphors, and engaging storytelling techniques.

## CONTEXT: Target Audience
Consider the intended audience and adjust complexity and themes accordingly.`}</pre>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </section>
            </TabsContent>

            <TabsContent value="api" className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-6">API Integration</h2>
                <p className="mb-6">
                  Integrate Prompt or Die into your own applications and workflows using our API.
                </p>

                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">API Documentation</h3>
                      <Button variant="outline" className="gap-2">
                        View Full Docs <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground">
                      Our REST API allows you to programmatically create, manage, and use prompt
                      templates.
                    </p>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Authentication</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="relative font-mono text-sm bg-muted p-4 rounded-md overflow-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2"
                            onClick={() =>
                              handleCopy(
                                `curl -X POST https://api.promptordie.tech/v1/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{"apiKey": "your_api_key"}'`,
                                'auth',
                              )
                            }
                          >
                            {copyStatus['auth'] ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <pre>{`curl -X POST https://api.promptordie.tech/v1/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{"apiKey": "your_api_key"}'`}</pre>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Get Prompt Templates</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="relative font-mono text-sm bg-muted p-4 rounded-md overflow-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2"
                            onClick={() =>
                              handleCopy(
                                `curl https://api.promptordie.tech/v1/templates \\
  -H "Authorization: Bearer {token}"`,
                                'templates',
                              )
                            }
                          >
                            {copyStatus['templates'] ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <pre>{`curl https://api.promptordie.tech/v1/templates \\
  -H "Authorization: Bearer {token}"`}</pre>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Generate Prompt</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="relative font-mono text-sm bg-muted p-4 rounded-md overflow-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2"
                            onClick={() =>
                              handleCopy(
                                `curl -X POST https://api.promptordie.tech/v1/generate \\
  -H "Authorization: Bearer {token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "blocks": [
      {
        "type": "intent",
        "label": "Summarize",
        "value": "Provide a concise summary of the text."
      },
      {
        "type": "format",
        "label": "Bullet Points",
        "value": "Format as bullet points."
      }
    ]
  }'`,
                                'generate',
                              )
                            }
                          >
                            {copyStatus['generate'] ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <pre>{`curl -X POST https://api.promptordie.tech/v1/generate \\
  -H "Authorization: Bearer {token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "blocks": [
      {
        "type": "intent",
        "label": "Summarize",
        "value": "Provide a concise summary of the text."
      },
      {
        "type": "format",
        "label": "Bullet Points",
        "value": "Format as bullet points."
      }
    ]
  }'`}</pre>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">SDK Integrations</h2>
                <p className="text-muted-foreground mb-6">
                  Coming soon: Official SDKs for JavaScript, Python, and other languages.
                </p>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                      <p className="text-muted-foreground">SDKs in development, check back soon</p>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            <TabsContent value="faq" className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>What makes a good prompt?</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-4">
                        A good prompt is clear, specific, and provides enough context for the AI to
                        understand exactly what you need. The best prompts typically:
                      </p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Clearly state the task or goal</li>
                        <li>Specify the desired format or structure of the response</li>
                        <li>Include any relevant context or constraints</li>
                        <li>Define the tone or style of communication</li>
                        <li>Break complex tasks into smaller, manageable parts</li>
                      </ul>
                      <p className="mt-4">
                        Using Prompt or Die's block-based approach helps you incorporate all these
                        elements into your prompts.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger>How do I integrate with specific AI models?</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-4">
                        Prompt or Die generates model-agnostic prompts that work with most modern AI
                        models and platforms. Our export options let you:
                      </p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Copy the raw prompt text to paste into any AI interface</li>
                        <li>Export as JSON for programmatic use via APIs</li>
                        <li>Use our upcoming API to integrate directly with your applications</li>
                      </ul>
                      <p className="mt-4">
                        We're working on specific integrations for popular models like GPT-4,
                        Claude, and others that will optimize prompts for each model's specific
                        capabilities.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>
                      Is there a limit to how many blocks I can use?
                    </AccordionTrigger>
                    <AccordionContent>
                      <p>
                        There's no hard limit on the number of blocks you can add to a prompt.
                        However, keep in mind that:
                      </p>
                      <ul className="list-disc list-inside space-y-2 mt-4">
                        <li>Most AI models have token limits for input prompts</li>
                        <li>More complex prompts aren't always better</li>
                        <li>Focus on clarity and specificity over length</li>
                      </ul>
                      <p className="mt-4">
                        We recommend starting with 3-5 blocks for most use cases and adding more
                        only if needed for complex tasks.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger>Can I save my prompts for later?</AccordionTrigger>
                    <AccordionContent>
                      <p>
                        Currently, you can export your prompts as JSON files that can be imported
                        later. We're working on adding user accounts with cloud storage so you can
                        save and access your prompts from anywhere.
                      </p>
                      <p className="mt-4">
                        In the meantime, we recommend exporting important prompts and saving them
                        locally.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5">
                    <AccordionTrigger>Is there an API for Prompt or Die?</AccordionTrigger>
                    <AccordionContent>
                      <p>Yes! We offer a RESTful API that allows you to:</p>
                      <ul className="list-disc list-inside space-y-2 mt-4">
                        <li>Generate prompts programmatically</li>
                        <li>Access and use community templates</li>
                        <li>Save and manage your own prompt library</li>
                      </ul>
                      <p className="mt-4">
                        Check out the API tab in the documentation for more details and examples.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4 py-4">
                      <p>Can't find what you're looking for? Reach out to our team.</p>
                      <Button className="bg-primary hover:bg-primary/90">Contact Support</Button>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Docs;
