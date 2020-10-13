Localization data files for the Jade Tree Currency library live within the
`@jadetree/currency/locales` module, separated by language. To import and use
a locale, use the following syntax:

```typescript
// ES5 Module
import { de_AT } from '@jadetree/currency/locales/de';

// CommonJs Module
const { fr_FR } = require('@jadetree/currency/locales/fr');

// Use the locale for formatting (returns '1,23')
format('1.23', de_AT.decimalPattern, { locale: de_AT });
```

Each language file contains all the locales for the language. A special
language file `root` contains the base locale inherited by all languages, and
is used for a fallback in case a locale is not specified. Use of the special
`root` locale will typically be limited to defining new locale objects such as
the following example:

```typescript
import { Locale, format } from '@jadetree/currency';
import { root } from '@jadetree/currency/locales/root';

// See the LocaleData interface for what can be passed to new Locale()
// this creates a locale where the decimal point is represented by '-d-' and
// numbers are grouped by '-g-'.
const zz_ZZ_1 = new Locale('zz_ZZ_Priv1', { g: '-g-', d: '-d-' }, root);

// Returns '1-g-234-d-56'
format('1234.56', zz_ZZ_1.decimalPattern, { locale: zz_ZZ_1 });
```
