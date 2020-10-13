@jadetree/currency
==================

Javascript localized currency handling and formatting library for the Jade Tree
budgeting software using Unicode CLDR data.

Using jadetree-currency is easy:

```javascript
import { Money, Currency, Locale } from '@jadetree/currency';

// Load l10n data from the locales sub-package
import { de_DE } from '@jadetree/currency/locales/de';
import { en_US } from '@jadetree/currency/locales/en';

/* CommonJS (Node.js) Syntax */
const { Money, Currency, Locale } = require('@jadetree/currency');
const { de_DE } = require('@jadetree/currency/locales/de');
const { en_US } = require('@jadetree/currency/locales/en');

// Format into a localized string
m2.format(en_US);     // '$4.50'
m2.format(de_DE);     // '4,50\u00a0$'

// Localized parsing works too, with default currency for the locale
const m3 = new Money('1 234,56', new Locale('fr_FR'));
m3.format(new Locale('en_US'));     // €1,234.56
```

For use in a browser without additional packaging (e.g. when a backend API can
determine which locale data to serve), the files in the dist directory may be
included as script tags, as in the following example which loads only the
German localization data to reduce transfer and load time.

```html
<script type="text/javascript" src="https://a-great-cdn/dist/jt-currency.min.js"></script>
<script type="text/javascript" src="https://a-great-cdn/dist/jt-l10n.de.js"></script>
```

For a working example of jt-currency in a single HTML page, open the index.html
file in the demo folder in your browser.

```shell
git clone https://github.com/asymworks/jt-currency.git
cd jt-currency/demo
open index.html
```
>>>>>>> money

Features
--------

- Major world currency data from ISO 4217 included
- Localization data for currency and number formatting included and integrated -
no external internationalization or localization helper libraries required
- Flexible formatting options
- Handles any type of money input: strings, numbers, Decimals
- Only one dependency

Installation
------------

Install jadetree-currency by running:

```shell
yarn add @jadetree/currency
```

Contribute
----------

- Issue Tracker: https://github.com/asymworks/jadetree-currency/issues
- Source Code: https://github.com/asymworks/jadetree-currency

API Documentation
-----------------

In Work

License
-------

The project is licensed under the BSD license.
