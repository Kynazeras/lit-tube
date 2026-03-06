# Lit Webcomponents Youtube search / bookmark

## Starter kit disclosure

This project used the official [lit-element-starter-ts](https://github.com/lit/lit-element-starter-ts#) as a jumping off point.

## How to run

Install dependencies:

```
npm install
```

Build the JavaScript version of the site:

```
npm run build
```

Run the dev server and open the project in a new browser tab:

```
npm run serve
```

You will also need to provide your own YouTube api key and place it in `config.ts` for the search to populate

## Architectural Decision Record

-   **Typescript**: I chose TypeScript because it is what I am most comfortable using. I like being able to leverage intellisence and strict type checking to catch errors early and often
-   **Lit Context**: I chose Lit Context because it seemed closest to the React's `useContext()` that I am familiar with. It's simple, lightweight and gives the developer a fair amount of control on how components should react to global updates.
-   **Config**: I used a `config.ts` file for simplicity sake. I've used the patter before and it keeps my YouTube key from accidentally making it into source control.
-   **File Structure**: Since I am new to Lit, this was actually guided by AI (Github Copilot). You can read more about that in `AI-LOG.md`
