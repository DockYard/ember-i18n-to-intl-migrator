# ember-i18n-to-intl-migrator

> A node script to migrate both your translation files and service injections to ember-intl

## Installation

Run the following command in your terminal:

```bash
npm install ember-i18n-intl-migrator -g
```

## Usage

To transform the translation files run:

```bash
ember-i18n-intl-migrator # default conversion to json
ember-i18n-intl-migrator --type=yaml
```

To also run the codemod that will replace `i18n: service()` by `intl: service()` (and it's usages), you
first have to install `jscodeshift` with:

```sh
npm install -g jscodeshift
```

Then you can run the codemod with:

```sh
jscodeshift -t https://raw.githubusercontent.com/DockYard/ember-i18n-to-intl-migrator/master/lib/codemod.js app/
```
