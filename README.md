@jadetree/currency
==================

Javascript localized currency handling and formatting library for the Jade Tree
budgeting software using Unicode CLDR data.

Using jadetree-currency is easy:

```javascript
import {
  Currency, format, parse
} from '@jadetree/currency';

// Load l10n information dynamically (only en_US and en_US_POSIX are loaded
// by default). In the browser, include with a <script> tag instead.
import { de_DE, en_US, fr } from '@jadetree/currency/locales';

/* CommonJS (Node.js) Syntax */
const { Currency, format } = require('@jadetree/currency');
const { de_DE, en_US, fr } = require('@jadetree/currency/locales');

// Format a decimal number into a localized string
format(
  new Decimal('4.50'),
  en_US.currencyPattern,
  { locale: en_US, currency: new Currency('USD') },
) // $4.50

format(
  new Decimal('4.50'),
  de_DE.currencyPattern,
  { locale: de_DE, currency: new Currency('USD') },
) // 4,50 $

// Parse a decimal number
parse('1 234,56', { locale: fr }).toString() // 1234.56

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

- Issue Tracker: https://github.com/asymworks/jt-currency/issues
- Source Code: https://github.com/asymworks/jt-currency

API Documentation
-----------------

In Work

License
-------

The project is licensed under the BSD license.
