import { expect, should } from 'chai';
import Decimal from 'decimal.js-light';

import Currency from '../src/currency';
import format from '../src/formatter';
import { Locale } from '../src/locale';
import { en } from '../src/locales/en';
import { parsePattern, NumberPattern } from '../src/numpattern';

describe('Number Formatter', function() {
  it('should format numeric values', function() {
    var testNp: NumberPattern = parsePattern('0.##');
    expect(format(1.234, testNp)).to.equal('1.23');
    expect(format(1, testNp)).to.equal('1');
  });

  it('should format string values', function() {
    var testNp: NumberPattern = parsePattern('0.##');
    expect(format('1.234', testNp)).to.equal('1.23');
    expect(format('1', testNp)).to.equal('1');
  });

  it('should format Decimal values', function() {
    var testNp: NumberPattern = parsePattern('0.##');
    expect(format(new Decimal(1.234), testNp)).to.equal('1.23');
    expect(format(new Decimal(1), testNp)).to.equal('1');
  });

  it('should render scientific notation patterns', function() {
    var testNp1: NumberPattern = parsePattern('0.##E0');
    var testNp2: NumberPattern = parsePattern('#E0');
    var testNp3: NumberPattern = parsePattern('@@#E+0');
    expect(format(12345, testNp1)).to.equal('1.23E4');
    expect(format(0.01234, testNp1)).to.equal('1.23E-2');
    expect(format(12345, testNp2)).to.equal('1.2345E4');
    expect(format(0.01234, testNp2)).to.equal('1.234E-2');
    expect(format(12345, testNp3)).to.equal('12.345E+3');
    expect(format(0.01234, testNp3)).to.equal('12.34E-3');
  });

  it('should render significant digit patterns', function() {
    var testNp1: NumberPattern = parsePattern('@@@');
    var testNp2: NumberPattern = parsePattern('@@##');
    expect(format(12345, testNp1)).to.equal('12300');
    expect(format(0.12345, testNp1)).to.equal('0.123');
    expect(format(12345, testNp2)).to.equal('12350');
    expect(format(0.12345, testNp2)).to.equal('0.1235');
  });

  it('should format currency with symbols', function() {
    var testNp: NumberPattern = parsePattern('¤\u00a0#,##0.00');
    expect(format(
      1234567.89,
      testNp,
      {
        locale: en,
        currency: new Currency('USD'),
      }
    )).to.equal('$\u00a01,234,567.89');
  });

  it('should format currency with codes', function() {
    var testNp: NumberPattern = parsePattern('¤¤\u00a0#,##0.00');
    expect(format(
      1234567.89,
      testNp,
      {
        locale: en,
        currency: new Currency('USD'),
      }
    )).to.equal('USD\u00a01,234,567.89');
  });

  it('should format currency with names', function() {
    var testNp: NumberPattern = parsePattern('#,##0.00\u00a0¤¤¤');
    expect(format(
      1234567.89,
      testNp,
      {
        locale: en,
        currency: new Currency('USD'),
      }
    )).to.equal('1,234,567.89\u00a0US Dollar');
  });

  it('should format currencies with currency-specified precision', function() {
    var testNp: NumberPattern = parsePattern('¤\u00a0#,##0.00');
    expect(format(
      1234567.89,
      testNp,
      {
        locale: en,
        currency: new Currency('XXX'),
      }
    )).to.equal('¤\u00a01,234,568');
  });

  it('should pad numbers to minimum length', function() {
    var testNp1: NumberPattern = parsePattern('000.000');
    var testNp2: NumberPattern = parsePattern('000.#');
    var testNp3: NumberPattern = parsePattern('0.000');
    expect(format('1.2', testNp1)).to.equal('001.200');
    expect(format('1.2', testNp2)).to.equal('001.2');
    expect(format('1.2', testNp3)).to.equal('1.200');
  });
});
