import { expect, should } from 'chai';

import { parse } from '../src/parser';
import { Locale } from '../src/locale';

import { de } from '../src/locales/de';
import { en } from '../src/locales/en';
import { ru } from '../src/locales/ru';

describe('Number Parser', function() {
  describe('Number Parsing', function() {
    it('should parse localized numeric strings', function() {
      expect(parse('1,234.567', { locale: en, strict: true }).toString()).to.equal('1234.567');
      expect(parse('1,234.567', { locale: en, strict: false }).toString()).to.equal('1234.567');
    });

    it('should throw an error for invalid numeric strings', function() {
      var testFn = function() { parse('abc') };
      expect(testFn).to.throw();
    });

    it('should suggest proper formatting for swapped group and decimal symbols', function() {
      var testFn1 = function() { parse('1.234,56', { locale: en, strict: true }) }
      var testFn2 = function() { parse('12,34,567.89', { locale: en, strict: true }) }
      expect(testFn1).to.throw(/Did you mean 1.235 or 1,234.56/);
      expect(testFn2).to.throw(/Did you mean 1,234,567.89/);
    });

    it('should accept spaces for narrow NBSP groupings in non-strict mode', function() {
      var testObj1 = new Locale('zt', {
        d: ',',
        g: ' ',
        p: '+',
        m: '-',
        pc: '%',
        pm: '‰',
        e: 'E',
        x: '×',
        inf: '∞',
        nan: 'NaN',
        np: '#,##0.###',
        cp: '#,##0.00 ¤',
        ap: '#,##0.00 ¤;(#,##0.00 ¤)',
        cn: {
          XXX: 'Unknown Currency'
        },
        cs: {
          XXX: '¤'
        },
      });
      var bspNumber = '1 234,567';
      var nbspNumber = bspNumber.replace(' ', '\u202f');
      var testFn1 = function() { return parse(bspNumber, { locale: testObj1, strict: false }) };
      var testFn2 = function() { return parse(nbspNumber, { locale: testObj1, strict: false }) };
      expect(testFn1).to.not.throw();
      expect(testFn2).to.not.throw();
    });

    it('should not accept spaces for narrow NBSP groupings in strict mode', function() {
      var testObj1 = new Locale('zt', {
        d: ',',
        g: ' ',
        p: '+',
        m: '-',
        pc: '%',
        pm: '‰',
        e: 'E',
        x: '×',
        inf: '∞',
        nan: 'NaN',
        np: '#,##0.###',
        cp: '#,##0.00 ¤',
        ap: '#,##0.00 ¤;(#,##0.00 ¤)',
        cn: {
          XXX: 'Unknown Currency'
        },
        cs: {
          XXX: '¤'
        },
      });
      var bspNumber = '1 234,567';
      var nbspNumber = bspNumber.replace(' ', '\u202f');
      var testFn1 = function() { return parse(bspNumber, { locale: testObj1, strict: true }) };
      var testFn2 = function() { return parse(nbspNumber, { locale: testObj1, strict: true }) };
      expect(testFn1).to.throw();
      expect(testFn2).to.not.throw();
    });

    it('should match documented examples', function() {
      var testFn = function() { return parse('2,109,998', { locale: de }) };
      expect(parse('1,099.98', { locale: en }).toString()).to.equal('1099.98');
      expect(parse('1.099,98', { locale: de }).toString()).to.equal('1099.98');
      expect(parse('12 345,12', { locale: ru }).toString()).to.equal('12345.12');
      expect(testFn).to.throw(/2,109,998 is not a properly formatted decimal number/);
    });

    it('should accept strings with preceeding and trailing spaces', function() {
      expect(parse('  1,099.98', { locale: en }).toString()).to.equal('1099.98');
      expect(parse('1,099.98  ', { locale: en }).toString()).to.equal('1099.98');
      expect(parse('  1,099.98  ', { locale: en }).toString()).to.equal('1099.98');
    });
  });
});
