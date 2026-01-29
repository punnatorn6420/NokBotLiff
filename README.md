# LiffNokAir

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.2.8.

## Development server

Run `npm install` once, then `npm run start` (or `ng serve`) for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### LIFF local development notes

This project initializes LIFF using the channel ID in `src/app/services/liff.service.ts`. When you open `http://localhost:4200/...` directly in a browser, LINE will redirect and can show `invalid url` errors if the LIFF URL is not registered in the LINE Developers Console. To run locally:

1. Open **LINE Developers Console → LIFF**.
2. Add the exact local URL you are using (for example `http://localhost:4200/botnoi-liff/pdpa`) to the LIFF app URL whitelist.
3. Reload the page after saving the LIFF URL.

If you are not testing inside the LINE client, you can still use `ng serve` locally, but LIFF login will only succeed when the URL matches the registered LIFF URL.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Project structure

- `src/app/pages/` — route-level pages/screens.
- `src/app/services/` — shared services (API, LIFF, data passing, date adapters).
- `src/app/shared/` — shared UI components and modules.
- `src/app/interceptors/` — HTTP interceptors.
- `src/types/` — global type declarations.

## Running unit tests

Run `npm run test` (or `ng test`) to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
