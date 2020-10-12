import { expect, should } from 'chai';
import { Locale, LocaleData } from '../src/locale';
import { en_US_POSIX } from '../src/locales/en';

describe('Locale Class', function() {
  describe('Behavior and Data', function() {
    it('should have a public constructor', function() {
      var testFn = function() { return new Locale('zz', { }); }
      expect(testFn).to.not.throw();
    });

    it('should return frozen objects', function() {
      var testObj = en_US_POSIX;
      expect(testObj).to.be.frozen;
      expect(testObj.decimalPattern).to.be.frozen;
      expect(testObj.currencyPattern).to.be.frozen;
      expect(testObj.accountingPattern).to.be.frozen;
      expect(testObj.percentagePattern).to.be.frozen;
      expect(testObj.scientificPattern).to.be.frozen;
    });

    it('should accept a minimal locale definition', function() {
      const data: LocaleData = {
        d: '.',
        g: ',',
      };
      const locale = new Locale('zz', data);
      expect(locale.tag).to.equal('zz');
      expect(locale.language).to.equal('zz');
      should().equal(locale.territory, undefined);
      should().equal(locale.script, undefined);
      should().equal(locale.variant, undefined);

      expect(locale.decimal).to.equal('.');
      expect(locale.group).to.equal(',');
    });

    it('should provide the en_US_POSIX locale', function() {
      should().not.equal(en_US_POSIX, undefined);
    });

    it('should expose the parsed locale tag fields', function() {
      expect(en_US_POSIX).to.have.property('language', 'en');
      expect(en_US_POSIX).to.have.property('territory', 'US');
      should().equal(en_US_POSIX.script, undefined);
      expect(en_US_POSIX).to.have.property('variant', 'POSIX');
    });

    it('should contain number formatting symbols', function() {
      expect(en_US_POSIX).to.have.property('decimal', '.');
      expect(en_US_POSIX).to.have.property('group', ',');
      expect(en_US_POSIX).to.have.property('plusSign', '+');
      expect(en_US_POSIX).to.have.property('minusSign', '-');
      expect(en_US_POSIX).to.have.property('exponential', 'E');
      expect(en_US_POSIX).to.have.property('superscriptingExponent', '×');
      expect(en_US_POSIX).to.have.property('percentSign', '%');
      expect(en_US_POSIX).to.have.property('permilleSign', '0/00');
    });

    it('should contain strings to represent infinity and non-number values', function() {
      expect(en_US_POSIX).to.have.property('inf', 'INF');
      expect(en_US_POSIX).to.have.property('nan', 'NaN');
    });

    it('should resolve symbol properties recursively', function() {
      const l1 = new Locale('zz_001', { d: 'd1', g: 'g1', p: 'p1' });
      const l2 = new Locale('zz_010', { d: 'd2', g: 'g2' }, l1);
      const l3 = new Locale('zz_100', { d: 'd3' }, l2);

      expect(l1.decimal).to.equal('d1');
      expect(l1.group).to.equal('g1');
      expect(l1.plusSign).to.equal('p1');

      expect(l2.decimal).to.equal('d2');
      expect(l2.group).to.equal('g2');
      expect(l2.plusSign).to.equal('p1');

      expect(l3.decimal).to.equal('d3');
      expect(l3.group).to.equal('g2');
      expect(l3.plusSign).to.equal('p1');
    });

    it('should resolve map properties recursively', function() {
      const l1 = new Locale(
        'zz_001',
        {
          cn: { 'AUD': 'AAA 1', 'CAD': 'BBB 1', 'USD': 'CCC 1' },
          cs: { 'AUD': 'a1', 'CAD': 'b1', 'USD': 'c1' },
        }
      );
      const l2 = new Locale(
        'zz_010',
        {
          cn: { 'AUD': 'AAA 2', 'CAD': 'BBB 2' },
          cs: { 'AUD': 'a2', 'CAD': 'b2' },
        },
        l1
      );
      const l3 = new Locale(
        'zz_100',
        {
          cn: { 'AUD': 'AAA 3' },
          cs: { 'AUD': 'a3' },
        },
        l2
      );

      expect(l1.currencyName('AUD')).to.equal('AAA 1');
      expect(l1.currencyName('CAD')).to.equal('BBB 1');
      expect(l1.currencyName('USD')).to.equal('CCC 1');

      expect(l2.currencyName('AUD')).to.equal('AAA 2');
      expect(l2.currencyName('CAD')).to.equal('BBB 2');
      expect(l2.currencyName('USD')).to.equal('CCC 1');

      expect(l3.currencyName('AUD')).to.equal('AAA 3');
      expect(l3.currencyName('CAD')).to.equal('BBB 2');
      expect(l3.currencyName('USD')).to.equal('CCC 1');

      expect(l1.currencySymbol('AUD')).to.equal('a1');
      expect(l1.currencySymbol('CAD')).to.equal('b1');
      expect(l1.currencySymbol('USD')).to.equal('c1');

      expect(l2.currencySymbol('AUD')).to.equal('a2');
      expect(l2.currencySymbol('CAD')).to.equal('b2');
      expect(l2.currencySymbol('USD')).to.equal('c1');

      expect(l3.currencySymbol('AUD')).to.equal('a3');
      expect(l3.currencySymbol('CAD')).to.equal('b2');
      expect(l3.currencySymbol('USD')).to.equal('c1');
    });
  });
});
