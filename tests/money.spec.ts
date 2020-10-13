import { expect } from 'chai';
import Decimal from 'decimal.js-light';
import { Locale } from '../src/locale';
import { de_DE } from '../src/locales/de';
import { en_US, en_US_POSIX } from '../src/locales/en';
import Money from '../src/money';
import Currency from '../src/currency';

describe('Money Value Object', function() {
  describe('Constructors', function() {
    it('should have a public constructor', function() {
      var testFn = function() { return new Money(0) };
      expect(testFn).to.not.throw();
    });

    it('should have copy constructor semantics', function() {
      var m1 = new Money(1, 'USD');
      var m2 = new Money(m1);
      expect(m1).to.deep.equal(m2);
    });

    it('should accept a Currency type', function() {
      var testCcy = new Currency('USD');
      var testObj = new Money(0, testCcy);
      expect(testObj.currency).to.equal(testCcy);
    });

    it('should accept an ISO 4217 currency code', function() {
      var testCcy = new Currency('USD');
      var testObj = new Money(0, 'USD');
      expect(testObj.currency).to.equal(testCcy);
    });

    it('should accept an ISO 4127 numeric code', function() {
      var testCcy = new Currency('USD');
      var testObj = new Money(0, 840);
      expect(testObj.currency).to.equal(testCcy);
    });

    it('should default to Unknown Currency', function() {
      var testCcy = new Currency('XXX');
      var testObj = new Money(0);
      expect(testObj.currency).to.equal(testCcy);
    });

    it('should accept Numeric amounts', function() {
      var testObj = new Money(1.23);
      expect(testObj.amount).to.deep.equal(new Decimal(1.23));
    });

    it('should accept Decimal amounts', function() {
      var testObj = new Money(new Decimal(2.34));
      expect(testObj.amount).to.deep.equal(new Decimal(2.34));
    });

    it('should accept String amounts', function() {
      var testObj = new Money('3.45');
      expect(testObj.amount).to.deep.equal(new Decimal(3.45));
    });

    it('should accept localized String amounts', function() {
      var testObj = new Money('3.456,78', 'USD', de_DE);
      expect(testObj.currency).to.equal(new Currency('USD'));
      expect(testObj.amount).to.deep.equal(new Decimal(3456.78));
    });

    it('should use locale-default currency if not specified', function() {
      var testObj1 = new Money('3.45', en_US_POSIX);
      expect(testObj1.currency).to.equal(new Currency('USD'));
    });

    it('should return frozen objects', function() {
      var testObj = new Money(0);
      expect(testObj).to.be.frozen;
    });
  });

  describe('Behavior and Data', function() {
    it('should resolve to a meaningful string value', function() {
      var testObj = new Money('1.23');
      expect(testObj.toString()).to.equal('<1.230000 XXX>')
    });

    it('should support adding money values', function() {
      var m1 = new Money(2.51, 'USD');
      var m2 = m1.add(0.01);
      var m3 = m1.add(new Money(0.01, 'USD'));
      var m4 = m1.add(new Decimal(0.01));
      var m5 = m1.add('0.01');
      expect(m2).to.not.equal(m1);
      expect(m2).to.have.property('currency', m1.currency);
      expect(m2).to.have.property('amount');
      expect(m2.amount).to.deep.equal(new Decimal('2.52'));

      expect(m3).to.not.equal(m1);
      expect(m3).to.have.property('currency', m1.currency);
      expect(m3).to.have.property('amount');
      expect(m3.amount).to.deep.equal(new Decimal('2.52'));

      expect(m4).to.not.equal(m1);
      expect(m4).to.have.property('currency', m1.currency);
      expect(m4).to.have.property('amount');
      expect(m4.amount).to.deep.equal(new Decimal('2.52'));

      expect(m5).to.not.equal(m1);
      expect(m5).to.have.property('currency', m1.currency);
      expect(m5).to.have.property('amount');
      expect(m5.amount).to.deep.equal(new Decimal('2.52'));
    });

    it('should support subtracting money values', function() {
      var m1 = new Money(2.51);
      var m2 = m1.subtract(0.01);
      var m3 = m1.subtract(new Money(0.01));
      var m4 = m1.subtract(new Decimal(0.01));
      var m5 = m1.subtract('0.01');
      expect(m2).to.not.equal(m1);
      expect(m2).to.have.property('currency', m1.currency);
      expect(m2).to.have.property('amount');
      expect(m2.amount).to.deep.equal(new Decimal('2.50'));

      expect(m3).to.not.equal(m1);
      expect(m3).to.have.property('currency', m1.currency);
      expect(m3).to.have.property('amount');
      expect(m3.amount).to.deep.equal(new Decimal('2.50'));

      expect(m4).to.not.equal(m1);
      expect(m4).to.have.property('currency', m1.currency);
      expect(m4).to.have.property('amount');
      expect(m4.amount).to.deep.equal(new Decimal('2.50'));

      expect(m5).to.not.equal(m1);
      expect(m5).to.have.property('currency', m1.currency);
      expect(m5).to.have.property('amount');
      expect(m5.amount).to.deep.equal(new Decimal('2.50'));
    });

    it('should throw an error for math involving two different currencies', function() {
      var m1 = new Money('0.50', 'USD');
      var m2 = new Money('0.50', 'EUR');
      var testFn1 = function() { return m1.add(m2) };
      var testFn2 = function() { return m1.subtract(m2) };
      expect(testFn1).to.throw();
      expect(testFn2).to.throw();
    });

    it('should support multiplication', function() {
      var m1 = new Money('1.11', 'XXX');
      var m2 = new Money('1.11', 'USD');
      expect(m1.multiply(1.01).amount).to.deep.equal(new Decimal('1.1211'));
      expect(m2.multiply(1.01).amount).to.deep.equal(new Decimal('1.12'));
      expect(m2.multiply(1.01, Decimal.ROUND_UP).amount).to.deep.equal(new Decimal('1.13'));
    });it('should support even distribution of positive values', function() {
      var m1 = new Money('1.12', 'USD');
      var d = m1.distribute(5);
      expect(d).is.an('array');
      expect(d).to.deep.equal([
        new Money('0.23', 'USD'),
        new Money('0.23', 'USD'),
        new Money('0.22', 'USD'),
        new Money('0.22', 'USD'),
        new Money('0.22', 'USD'),
      ]);
    });

    it('should support even distribution of negative values', function() {
      var m1 = new Money('-1.12', 'USD');
      var d = m1.distribute(5);
      expect(d).is.an('array');
      expect(d).to.deep.equal([
        new Money('-0.22', 'USD'),
        new Money('-0.22', 'USD'),
        new Money('-0.22', 'USD'),
        new Money('-0.23', 'USD'),
        new Money('-0.23', 'USD'),
      ]);
    });

    it('should support uneven distribution of positive numbers', function() {
      var m1 = new Money('1.12', 'USD');
      var d1 = m1.distribute([1, 2, 3, 5]);
      var d2 = m1.distribute([1, 3, 5]);
      expect(d1).is.an('array');
      expect(d1).to.deep.equal([
        new Money('0.11', 'USD'),
        new Money('0.21', 'USD'),
        new Money('0.30', 'USD'),
        new Money('0.50', 'USD'),
      ]);
      expect(d2).is.an('array');
      expect(d2).to.deep.equal([
        new Money('0.13', 'USD'),
        new Money('0.37', 'USD'),
        new Money('0.62', 'USD'),
      ]);
    });

    it('should support uneven distribution of negative numbers', function() {
      var m1 = new Money('-1.12', 'USD');
      var d1 = m1.distribute([1, 2, 3, 5]);
      var d2 = m1.distribute([1, 3, 5]);
      expect(d1).is.an('array');
      expect(d1).to.deep.equal([
        new Money('-0.10', 'USD'),
        new Money('-0.20', 'USD'),
        new Money('-0.31', 'USD'),
        new Money('-0.51', 'USD'),
      ]);
      expect(d2).is.an('array');
      expect(d2).to.deep.equal([
        new Money('-0.12', 'USD'),
        new Money('-0.37', 'USD'),
        new Money('-0.63', 'USD'),
      ]);
    });

    it('should resolve Foemmel\'s Conundrum', function() {
      var m = new Money('0.05', 'USD');
      var d = m.distribute([3, 7]);
      expect(d).is.an('array');
      expect(d).to.deep.equal([
        new Money('0.02', 'USD'),
        new Money('0.03', 'USD'),
      ])
    });

    it('should be comparable', function() {
      var m1 = new Money('2.51');
      var m2 = new Money('2.52');
      var m3 = new Money('2.53', 'USD');
      var m4 = new Money('2.51');
      var testFn = function() { return m2.cmp(m3) };
      expect(testFn).to.throw('Cannot compare money of currency USD to currency XXX');
      expect(m1.cmp(m2)).to.equal(-1);
      expect(m2.cmp(m1)).to.equal(1);
      expect(m1.cmp(m4)).to.equal(0);
      expect(m1.cmp(2)).to.equal(1);
    });

    it('should provide helper comparison operations', function() {
      var m1 = new Money('2.51');
      var m2 = new Money('2.52');
      var m3 = new Money('2.53', 'USD');
      var m4 = new Money('2.51');
      var testFn = function() { return m2.le(m3) };
      expect(testFn).to.throw('Cannot compare money of currency USD to currency XXX');
      expect(m1.eq(m2)).to.equal(false);
      expect(m1.ne(m2)).to.equal(true);
      expect(m1.gt(m2)).to.equal(false);
      expect(m1.ge(m2)).to.equal(false);
      expect(m1.lt(m2)).to.equal(true);
      expect(m1.le(m2)).to.equal(true);

      expect(m2.eq(m1)).to.equal(false);
      expect(m2.ne(m1)).to.equal(true);
      expect(m2.gt(m1)).to.equal(true);
      expect(m2.ge(m1)).to.equal(true);
      expect(m2.lt(m1)).to.equal(false);
      expect(m2.le(m1)).to.equal(false);

      expect(m1.eq(m4)).to.equal(true);
      expect(m1.ne(m4)).to.equal(false);
      expect(m1.gt(m4)).to.equal(false);
      expect(m1.ge(m4)).to.equal(true);
      expect(m1.lt(m4)).to.equal(false);
      expect(m1.le(m4)).to.equal(true);
    });

    it('should support chaining operations', function() {
      var m1 = new Money(2.51);
      var m2 = m1.add(0.01).add(0.02);
      expect(m2).to.not.equal(m1);
      expect(m2).to.have.property('currency', m1.currency);
      expect(m2).to.have.property('amount');
      expect(m2.amount).to.deep.equal(new Decimal('2.54'));
    });

    it('should support localized formatting', function() {
      var m1 = new Money(1234567.89, 'EUR');
      var m2 = new Money(-3.50, 'CAD');

      expect(m1.format()).to.equal('€\u00a01,234,567.89');
      expect(m1.format(en_US_POSIX, 'accounting')).to.equal('€1,234,567.89');
      expect(m1.format(en_US)).to.equal('€1,234,567.89');
      expect(m1.format(en_US, 'accounting')).to.equal('€1,234,567.89');

      expect(m2.format()).to.equal('-CA$\u00a03.50');
      expect(m2.format(en_US_POSIX, 'accounting')).to.equal('(CA$3.50)');
      expect(m2.format(en_US)).to.equal('-CA$3.50');
      expect(m2.format(en_US, 'accounting')).to.equal('(CA$3.50)');
    });
  });
});
