# Welcome to your Lovable project
This repository powers **Prompt or Die**, a modular prompt toolkit and CLI.

## Project info

**URL**: https://lovable.dev/projects/33b968e9-b933-426d-8e6d-8a9195697cc8

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/33b968e9-b933-426d-8e6d-8a9195697cc8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/33b968e9-b933-426d-8e6d-8a9195697cc8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Environment Variables

Create a `.env` file based on `.env.example` and provide your credentials:

```bash
cp .env.example .env
# then edit .env and add your keys
```

- `VITE_SUPABASE_URL` – Supabase project URL
- `VITE_SUPABASE_ANON_KEY` – Supabase anon key
- `VITE_OPENAI_API_KEY` – OpenAI API key (optional if stored in the browser)

## Linting

Run ESLint to check code quality:

```bash
npm run lint
```

## CLI Usage

The repository includes a small command line tool named `pad` that mirrors the
browser terminal. Install dependencies with `npm install` and run commands via
`node cli/index.js`:

```bash
node cli/index.js build blocks.json
node cli/index.js inject prompt.txt "More context" --mode append
```

Run `node cli/index.js --help` to see all available options including login, prompt generation and clipboard export. The `ascii` command lets you generate colorful ASCII art interactively using fonts from figlet and gradient-string styles. Psst: try `node cli/index.js motto` for a tiny dose of Prompt or Die philosophy.
