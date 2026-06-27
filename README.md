# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Security & Configuration Note

To ensure privacy and prevent API key leakage, all credentials (including the OpenRouter API Key, Supabase URL, and Supabase Anon Key) are managed completely client-side. They are securely saved directly in your browser's `localStorage` via the **Settings Panel** and are never sent or transmitted to any middleman or external servers other than direct calls to OpenRouter and your own Supabase instance.

**For Reviewers:**
To instantly test the platform, simply open the **Settings** modal from the navigation header, input your own credentials (such as an OpenRouter API key and Supabase database details), and run prompts. The settings panel includes built-in connection testers to verify your setup before launching prompt runs.
