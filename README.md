# 2023 Hack Day ChatGPT Context Experiment
This is a relatively simple web app that utilizes ChatGPT (gpt-4) in the backend to facilitate user interactions but also serialize their intent and choices into a JSON object that can be acted upon by the backend to search for relevant media manager content.

## Environment
Create a `.env` file in the root of the project with the following variables:
```
OPEN_AI_API_KEY
INTERNAL_API_KEY
MEDIA_MANAGER_API_KEY
```
The `INTERNAL_API_KEY` is for a small, custom API for prototyping that allows doing PBS.org searches outside of PBS web apps. Please reach out to Nick Licitra (@nolicitra on slack) if you would like a key generated for you.

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
