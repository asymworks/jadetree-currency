import { expect } from 'chai';
import { Currency } from '../src/currency';

describe('Currency', function() {
  describe('Accessors', function() {
    it('should have a public accessor', function() {
      var testFn = function() { return new Currency('XXX'); }
      expect(testFn).to.not.throw();
    });

    it('should have only one instance per currency', function() {
      var testObj1 = new Currency('XXX');
      var testObj2 = new Currency('XXX');
      expect(testObj2).to.equal(testObj1);
      expect(testObj2).to.deep.equal(testObj1);
    });

    it('should be case insensitive', function() {
      var testObj1 = new Currency('XXX');
      var testObj2 = new Currency('xxx');
      var testObj3 = new Currency('XxX');
      expect(testObj2).to.equal(testObj1);
      expect(testObj3).to.equal(testObj1);
      expect(testObj2).to.deep.equal(testObj1);
      expect(testObj3).to.deep.equal(testObj1);
      expect(testObj2).to.have.property('currencyCode', 'XXX');
      expect(testObj3).to.have.property('currencyCode', 'XXX');
    });

    it('should return an array of available currency codes', function() {
      var ccyList = Currency.allCurrencies();
      expect(ccyList).to.be.an('array');
      expect(ccyList.length).to.be.at.least(1);
      expect(ccyList[0]).to.be.an('string');
    });

    it('should lookup the currencies by ISO Letter Code or Number', function() {
      var testObj1 = new Currency('XXX');
      var testObj2 = new Currency(999);
      expect(testObj1).to.be.an('object');
      expect(testObj2).to.be.an('object')
      expect(testObj2).to.equal(testObj1);
      expect(testObj2).to.deep.equal(testObj1);
    });

    it('should return frozen objects', function() {
      var testObj = new Currency('XXX');
      expect(testObj).to.be.frozen;
    });
  });

  describe('Behavior and Data', function() {
    it('should contain a valid Unknown Currency placeholder', function() {
      var testObj = new Currency('XXX');
      expect(testObj).to.have.property('currencyCode', 'XXX');
      expect(testObj).to.have.property('numericCode', 999);
      expect(testObj).to.have.property('precision', 6);
    });

    it('should throw an exception when an unknown Currency is accessed', function() {
      var testFn1 = function() { return new Currency('XYZ'); }
      var testFn2 = function() { return new Currency(987); }
      expect(testFn1).to.throw();
      expect(testFn2).to.throw();
    });

    it('should contain the United States Dollar', function() {
      var testObj = new Currency('USD');
      expect(testObj).to.have.property('currencyCode', 'USD');
      expect(testObj).to.have.property('numericCode', 840);
      expect(testObj).to.have.property('precision', 2);
    });

    it('should contain the European Union Euro', function() {
      var testObj = new Currency('EUR');
      expect(testObj).to.have.property('currencyCode', 'EUR');
      expect(testObj).to.have.property('numericCode', 978);
      expect(testObj).to.have.property('precision', 2);
    });

    it('should contain the Australian Dollar', function() {
      var testObj = new Currency('AUD');
      expect(testObj).to.have.property('currencyCode', 'AUD');
      expect(testObj).to.have.property('numericCode', 36);
      expect(testObj).to.have.property('precision', 2);
    });

    it('should contain the Canadian Dollar', function() {
      var testObj = new Currency('CAD');
      expect(testObj).to.have.property('currencyCode', 'CAD');
      expect(testObj).to.have.property('numericCode', 124);
      expect(testObj).to.have.property('precision', 2);
    });

    it('should contain the Swiss Franc', function() {
      var testObj = new Currency('CHF');
      expect(testObj).to.have.property('currencyCode', 'CHF');
      expect(testObj).to.have.property('numericCode', 756);
      expect(testObj).to.have.property('precision', 2);
    });

    it('should throw an error when a currency is redefiend', function() {
      var testFn = function() { Currency.registerCurrency('USD', 840, 2); }
      expect(testFn).to.throw();
    });

    it('should resolve to a meaningful string', function() {
      var testObj = new Currency('XXX');
      expect(String(testObj)).to.equal("<Currency 'XXX'>");
    });

    it('should support adding a new currency', function() {
      var nCcys = Currency.allCurrencies().length;
      var newCcy = Currency.registerCurrency('ZZZ', 998, 3);
      var testObj;

      expect(newCcy).to.have.property('currencyCode', 'ZZZ');
      expect(newCcy).to.have.property('numericCode', 998);
      expect(newCcy).to.have.property('precision', 3);

      var testObj1 = new Currency('ZZZ');
      var testObj2 = new Currency(998);

      expect(testObj1).to.equal(newCcy);
      expect(testObj1).to.deep.equal(newCcy);

      expect(testObj2).to.equal(newCcy);
      expect(testObj2).to.deep.equal(newCcy);

      expect(Currency.allCurrencies().length).to.equal(nCcys + 1);
    });
  });
});
