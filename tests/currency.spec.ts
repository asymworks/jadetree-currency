import { expect } from 'chai';
import Currency from '../src/lib/currency';

describe('nvlps-currency: Currency', function() {
  describe('Accessors', function() {
    it('should have a public accessor', function() {
      var testFn = function() { return Currency('XXX'); }
      expect(testFn).to.not.throw();
    });

    it('should have only one instance per currency', function() {
      var testObj1 = Currency('XXX');
      var testObj2 = Currency('XXX');
      expect(testObj2).to.equal(testObj1);
      expect(testObj2).to.deep.equal(testObj1);
    });

    it('should be case insensitive', function() {
      var testObj1 = Currency('XXX');
      var testObj2 = Currency('xxx');
      var testObj3 = Currency('XxX');
      expect(testObj2).to.equal(testObj1);
      expect(testObj3).to.equal(testObj1);
      expect(testObj2).to.deep.equal(testObj1);
      expect(testObj3).to.deep.equal(testObj1);
      expect(testObj2).to.have.property('currencyCode', 'XXX');
      expect(testObj3).to.have.property('currencyCode', 'XXX');
    });

    it('should return an array of available currencies', function() {
      var ccyList = Currency.all();
      expect(ccyList).to.be.an('array');
      expect(ccyList.length).to.be.at.least(1);
      expect(ccyList[0]).to.be.an('object');
      expect(ccyList[0]).to.have.property('currencyCode');
      expect(ccyList[0]).to.have.property('numericCode');
      expect(ccyList[0]).to.have.property('precision');
    });

    it('should lookup the currencies by ISO Letter Code or Number', function() {
      var testObj1 = Currency('XXX');
      var testObj2 = Currency(999);
      expect(testObj1).to.be.an('object');
      expect(testObj2).to.be.an('object')
      expect(testObj2).to.equal(testObj1);
      expect(testObj2).to.deep.equal(testObj1);
    });

    it('should return frozen objects', function() {
      var testObj = Currency('XXX');
      expect(testObj).to.be.frozen;
    });
  });

  describe('Behavior and Data', function() {
    it('should contain a valid Unknown Currency placeholder', function() {
      var testObj = Currency('XXX');
      expect(testObj).to.have.property('currencyCode', 'XXX');
      expect(testObj).to.have.property('numericCode', 999);
      expect(testObj).to.have.property('precision', 6);
    });

    it('should throw an exception when an unknown Currency is accessed', function() {
      var testFn1 = function() { return Currency('XYZ'); }
      var testFn2 = function() { return Currency(987); }
      expect(testFn1).to.throw();
      expect(testFn2).to.throw();
    });

    it('should contain the United States Dollar', function() {
      var testObj = Currency('USD');
      expect(testObj).to.have.property('currencyCode', 'USD');
      expect(testObj).to.have.property('numericCode', 840);
      expect(testObj).to.have.property('precision', 2);
    });

    it('should contain the European Union Euro', function() {
      var testObj = Currency('EUR');
      expect(testObj).to.have.property('currencyCode', 'EUR');
      expect(testObj).to.have.property('numericCode', 978);
      expect(testObj).to.have.property('precision', 2);
    });

    it('should contain the Australian Dollar', function() {
      var testObj = Currency('AUD');
      expect(testObj).to.have.property('currencyCode', 'AUD');
      expect(testObj).to.have.property('numericCode', 36);
      expect(testObj).to.have.property('precision', 2);
    });

    it('should contain the Canadian Dollar', function() {
      var testObj = Currency('CAD');
      expect(testObj).to.have.property('currencyCode', 'CAD');
      expect(testObj).to.have.property('numericCode', 124);
      expect(testObj).to.have.property('precision', 2);
    });

    it('should contain the Swiss Franc', function() {
      var testObj = Currency('CHF');
      expect(testObj).to.have.property('currencyCode', 'CHF');
      expect(testObj).to.have.property('numericCode', 756);
      expect(testObj).to.have.property('precision', 2);
    });

    it('should throw an error when a currency is redefiend', function() {
      var testFn = function() { Currency.register('USD', 840, 2); }
      expect(testFn).to.throw();
    });

    it('should resolve to a meaningful string', function() {
      var testObj = Currency('XXX');
      expect(String(testObj)).to.equal("<Currency 'XXX'>");
    });

    it('should support adding a new currency', function() {
      var nCcys = Currency.all().length;
      var newCcy = Currency.register('ZZZ', 998, 3);
      var testObj;

      expect(newCcy).to.have.property('currencyCode', 'ZZZ');
      expect(newCcy).to.have.property('numericCode', 998);
      expect(newCcy).to.have.property('precision', 3);

      var testObj1 = Currency('ZZZ');
      var testObj2 = Currency(998);

      expect(testObj1).to.equal(newCcy);
      expect(testObj1).to.deep.equal(newCcy);

      expect(testObj2).to.equal(newCcy);
      expect(testObj2).to.deep.equal(newCcy);

      expect(Currency.all().length).to.equal(nCcys + 1);
    });

    it('should support checking whether an object is a Currency', function() {
      var testObj1 = Currency('USD');
      var testObj2 = { currencyCode: 'USD', numericCode: 840, precision: 2 };
      expect(Currency.isCurrency(testObj1)).to.be.true;
      expect(Currency.isCurrency(testObj2)).to.be.false;
    });
  });
});
