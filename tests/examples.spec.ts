import { expect } from 'chai';

import { Money, Currency, Locale } from '../src';
import { de_AT, de_DE } from '../src/locales/de';
import { en_US } from '../src/locales/en';

describe('Example Code', function() {
  describe('README.md Code', function() {
    it('should work as documented in the README', function() {
      const m = new Money('4.00', 'USD');
      const m2 = m.add(1).subtract('0.50');

      expect(m2.format(en_US)).to.equal('$4.50');
      expect(m2.format(de_DE)).to.equal('4,50\u00A0$');

      const m3 = new Money('1 234,56', de_AT);
      expect(m3.format(en_US)).to.equal('€1,234.56');
    });
  });
});
