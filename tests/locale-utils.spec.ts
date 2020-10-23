import { expect, should } from 'chai';
import { parseLocale, generateLocale, negotiateLocale} from '../src/locale-utils';

describe('Locale Utilities', function() {
  describe('Locale Tag Parsing', function() {
    it('should parse minimal locale "en" without error', function() {
      var ret = parseLocale('en');
      expect(ret).to.have.property('language', 'en');
      should().equal(ret.territory, undefined);
      should().equal(ret.script, undefined);
      should().equal(ret.variant, undefined);
    });
    it('should parse locale locale "en-us" without error', function() {
      var ret = parseLocale('en-us', '-');
      expect(ret).to.have.property('language', 'en');
      expect(ret).to.have.property('territory', 'US');
      should().equal(ret.script, undefined);
      should().equal(ret.variant, undefined);
    });
    it('should parse locale "en-US-POSIX" without error', function() {
      var ret = parseLocale('en-US-POSIX', '-');
      expect(ret).to.have.property('language', 'en');
      expect(ret).to.have.property('territory', 'US');
      should().equal(ret.script, undefined);
      expect(ret).to.have.property('variant', 'POSIX');
    });
    it('should parse locale "zh_Hans_CN" without error', function() {
      var ret = parseLocale('zh_Hans_CN');
      expect(ret).to.have.property('language', 'zh');
      expect(ret).to.have.property('territory', 'CN');
      expect(ret).to.have.property('script', 'Hans');
      should().equal(ret.variant, undefined);
    });
    it('should normalize case of "EN-sCRP-us-Varnt"', function() {
      var ret = parseLocale('EN-sCRP-us-Varnt', '-');
      expect(ret).to.have.property('language', 'en');
      expect(ret).to.have.property('territory', 'US');
      expect(ret).to.have.property('script', 'Scrp');
      expect(ret).to.have.property('variant', 'Varnt');
    });
    it('should support numeric territories as in "en-001"', function() {
      var ret = parseLocale('en-001', '-');
      expect(ret).to.have.property('language', 'en');
      expect(ret).to.have.property('territory', '001');
      should().equal(ret.script, undefined);
      should().equal(ret.variant, undefined);
    });
    it('should support numeric variants as in "en_US_1999"', function() {
      var ret = parseLocale('en_US_1999');
      expect(ret).to.have.property('language', 'en');
      expect(ret).to.have.property('territory', 'US');
      should().equal(ret.script, undefined);
      expect(ret).to.have.property('variant', '1999');
    });
    it('should support locale modifiers as in "en_US@euro"', function() {
      var ret = parseLocale('en_US@euro')
      expect(ret).to.have.property('language', 'en');
      expect(ret).to.have.property('territory', 'US');
      should().equal(ret.script, undefined);
      should().equal(ret.variant, undefined);
    });
    it('should reject invalid locale "no_not_a_LOCALE_String" with an exception', function() {
      var testFn = function() { parseLocale('no_not_a_LOCALE_String') };
      expect(testFn).to.throw();
    });
    it('should reject invalid language code "e4_US" with an exception', function() {
      var testFn = function() { parseLocale('e4_US') };
      expect(testFn).to.throw();
    });
  });

  describe('Locale Tag Generation', function() {
    it('should generate minimal locale "en" without error', function() {
      var ret = generateLocale({
        language: 'en'
      });
      expect(ret).to.equal('en');
    });
    it('should generate locale "de-AT-1999" without error', function() {
      var ret = generateLocale({
        language: 'de',
        territory: 'AT',
        variant: '1999',
      }, '-');
      expect(ret).to.equal('de-AT-1999');
    });
    it('should generate locale "zh_Hans_CN" without error', function() {
      var ret = generateLocale({
        language: 'zh',
        territory: 'CN',
        script: 'Hans',
      });
      expect(ret).to.equal('zh_Hans_CN');
    });
    it('should throw an error if no language key is provided', function() {
      var testFn = function() {
        generateLocale({
          language: '',
        });
      }
      expect(testFn).to.throw();
    });
  });

  describe('Locale Negotiation', function() {
    it('should select "de_DE" for negotiateLocale(["de_DE", "en_US"], ["de_DE", "de_AT"])', function() {
      expect(negotiateLocale(["de_DE", "en_US"], ["de_DE", "de_AT"])).to.equal("de_DE");
    });
    it('should select "en_US" for negotiateLocale(["de_DE", "en_US"], ["en_US", "en_US_POSIX"])', function() {
      expect(negotiateLocale(["de_DE", "en_US"], ["en_US", "en_US_POSIX"])).to.equal("en_US");
    });
    it('should return undefined for negotiateLocale(["zh_CN", "zh_TW"], ["de_DE", "de_AT"])', function() {
      should().equal(negotiateLocale(["zh_CN", "zh_TW"], ["de_DE", "de_AT"]), undefined);
    });
    it('should select "jp_JP" by language for negotiate_locale(["ja", "en_US"], ["ja_JP", "en_US"])', function() {
      expect(negotiateLocale(["ja", "en_US"], ["ja_JP", "en_US"])).to.equal("ja_JP");
    });
    it('should select "nb_NO" by alias for negotiate_locale(["no", "sv"], ["nb_NO", "sv_SE"])', function() {
      expect(negotiateLocale(["no", "sv"], ["nb_NO", "sv_SE"])).to.equal("nb_NO");
    });
    it('should select "en" for negotiateLocale(["de_DE", "en_US"], ["en", "es"])', function() {
      expect(negotiateLocale(["de_DE", "en_US"], ["en", "es"])).to.equal("en");
    });
  });
});
