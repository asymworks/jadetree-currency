import { expect } from 'chai';

import { Money, Currency, Locale, format } from '../src';
import { de_AT, de_DE } from '../src/locales/de';
import { en_US } from '../src/locales/en';
import root from '../src/locales/root';

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
  describe('tsDoc Code', function() {
    it('should support using locales as documented in the locale module overview', function() {
      expect(format('1.23', de_AT.decimalPattern || '', { locale: de_AT })).to.equal('1,23');
    });
    it('should support defining locales as documented in the locale module overview', function() {
      const zz_ZZ_1 = new Locale('zz_ZZ_Priv1', { g: '-g-', d: '-d-' }, root);
      expect(format('1234.56', zz_ZZ_1.decimalPattern || '', { locale: zz_ZZ_1 })).to.equal('1-g-234-d-56');
    });
    it('should support the money constructor examples', function() {
      const m1 = new Money('1,234.56', 'USD', en_US).toString();
      const m2 = new Money('1.234,56', 'EUR', de_DE).toString();
      const m3 = new Money('1,234.56').toString();

      expect(m1).to.equal('<1,234.560000 USD>');
      expect(m2).to.equal('<1,234.560000 EUR>');
      expect(m3).to.equal('<1,234.560000 XXX>');
    });
  });
});
