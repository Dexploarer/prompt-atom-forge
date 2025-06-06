import { buildPrompt, injectPrompt, BLOCK_TYPES } from 'prompt-or-die/sdk';

// Example prompt blocks
const blocks = [
  {
    id: '1',
    type: 'intent',
    label: 'Code Review',
    value: 'Please review the following code and provide feedback on best practices, potential bugs, and improvements.'
  },
  {
    id: '2',
    type: 'tone',
    label: 'Professional',
    value: 'Use a professional and constructive tone. Be specific and actionable in your feedback.'
  },
  {
    id: '3',
    type: 'format',
    label: 'Structured',
    value: 'Format your response with clear sections: Summary, Issues Found, Recommendations, and Best Practices.'
  }
];

// Build the prompt
const prompt = buildPrompt(blocks);
console.log('Generated Prompt:');
console.log('='.repeat(50));
console.log(prompt);
console.log('='.repeat(50));

// Example of injecting additional context
const codeToReview = `
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}
`;

const finalPrompt = injectPrompt(prompt, `

## CODE TO REVIEW:
${codeToReview}`, 'append');
console.log('\nFinal Prompt with Code:');
console.log('='.repeat(50));
console.log(finalPrompt);
