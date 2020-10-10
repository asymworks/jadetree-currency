import { expect, should } from 'chai';
import {
  parseGrouping,
  parsePrecision,
  parsePattern,
  GroupingSizes,
  PrecisionLimits,
  NumberPattern,
} from '../src/numpattern';

describe('Number Pattern Parser', function() {
  describe('Precision', function() {
    it('should parse formats with no minimum number of digits', function() {
      var ret: PrecisionLimits = parsePrecision('###');
      expect(ret.min).to.equal(0);
      expect(ret.max).to.equal(3);
    });

    it('should parse formats with a minimum number of digits', function() {
      var ret: PrecisionLimits = parsePrecision('##00');
      expect(ret.min).to.equal(2);
      expect(ret.max).to.equal(4);
    });

    it('should parse fixed-width formats', function() {
      var ret: PrecisionLimits = parsePrecision('00000');
      expect(ret.min).to.equal(5);
      expect(ret.max).to.equal(5);
    });

    it('should parse significant digit formats', function() {
      var ret: PrecisionLimits = parsePrecision('@@##');
      expect(ret.min).to.equal(2);
      expect(ret.max).to.equal(4);
    });
  });

  describe('Groupings', function() {
    it('should parse thousands-based groupings', function() {
      var ret: GroupingSizes = parseGrouping('#,##0');
      expect(ret.primary).to.equal(3);
      expect(ret.secondary).to.equal(3);
    });

    it('should parse Indian Vedic grouping', function() {
      var ret: GroupingSizes = parseGrouping('#,##,##0');
      expect(ret.primary).to.equal(3);
      expect(ret.secondary).to.equal(2);
    });

    it('should default to no grouping for invalid inputs', function() {
      var ret: GroupingSizes = parseGrouping('##');
      expect(ret.primary).to.equal(1000);
      expect(ret.secondary).to.equal(1000);
    });
  });

  describe('Number Patterns', function() {
    it('should parse the example CLDR "decimal long" format "#,##0.###"', function() {
      var ret: NumberPattern = parsePattern('#,##0.###');
      expect(ret.pattern).to.equal('#,##0.###');

      expect(ret.pPrefix).to.be.empty;
      expect(ret.pSuffix).to.be.empty;
      expect(ret.nPrefix).to.equal('-');
      expect(ret.nSuffix).to.be.empty;

      expect(ret.grouping.primary).to.equal(3);
      expect(ret.grouping.secondary).to.equal(3);

      expect(ret.intPrec.min).to.equal(1);
      expect(ret.intPrec.max).to.equal(4);
      expect(ret.fracPrec.min).to.equal(0);
      expect(ret.fracPrec.max).to.equal(3);

      should().equal(ret.expPrec, undefined);
      expect(ret.expPlus).to.be.false;
    });

    it('should parse the example CLDR "scientific long" format "0.000###E+00"', function() {
      var ret: NumberPattern = parsePattern('0.000###E+00');
      expect(ret.pattern).to.equal('0.000###E+00');

      expect(ret.pPrefix).to.be.empty;
      expect(ret.pSuffix).to.be.empty;
      expect(ret.nPrefix).to.equal('-');
      expect(ret.nSuffix).to.be.empty;

      expect(ret.grouping.primary).to.equal(1000);
      expect(ret.grouping.secondary).to.equal(1000);

      expect(ret.intPrec.min).to.equal(1);
      expect(ret.intPrec.max).to.equal(1);
      expect(ret.fracPrec.min).to.equal(3);
      expect(ret.fracPrec.max).to.equal(6);

      should().not.equal(ret.expPrec, undefined);
      if (ret.expPrec) {
        expect(ret.expPrec.min).to.equal(2)
        expect(ret.expPrec.max).to.equal(2)
      }

      expect(ret.expPlus).to.be.true;
    });

    it('should parse the example CLDR "scientific medium" format "0.00##E+00"', function() {
      var ret: NumberPattern = parsePattern('0.00##E+00');
      expect(ret.pattern).to.equal('0.00##E+00');

      expect(ret.pPrefix).to.be.empty;
      expect(ret.pSuffix).to.be.empty;
      expect(ret.nPrefix).to.equal('-');
      expect(ret.nSuffix).to.be.empty;

      expect(ret.grouping.primary).to.equal(1000);
      expect(ret.grouping.secondary).to.equal(1000);

      expect(ret.intPrec.min).to.equal(1);
      expect(ret.intPrec.max).to.equal(1);
      expect(ret.fracPrec.min).to.equal(2);
      expect(ret.fracPrec.max).to.equal(4);

      should().not.equal(ret.expPrec, undefined);
      if (ret.expPrec) {
        expect(ret.expPrec.min).to.equal(2)
        expect(ret.expPrec.max).to.equal(2)
      }

      expect(ret.expPlus).to.be.true;
    });

    it('should parse the example CLDR "long percent" format "#,##0%"', function() {
      var ret: NumberPattern = parsePattern('#,##0%');
      expect(ret.pattern).to.equal('#,##0%');

      expect(ret.pPrefix).to.be.empty;
      expect(ret.pSuffix).to.equal('%');
      expect(ret.nPrefix).to.equal('-');
      expect(ret.nSuffix).to.equal('%');

      expect(ret.grouping.primary).to.equal(3);
      expect(ret.grouping.secondary).to.equal(3);

      expect(ret.intPrec.min).to.equal(1);
      expect(ret.intPrec.max).to.equal(4);
      expect(ret.fracPrec.min).to.equal(0);
      expect(ret.fracPrec.max).to.equal(0);

      should().equal(ret.expPrec, undefined);
      expect(ret.expPlus).to.be.false;
    });

    it('should parse the example CLDR "accounting" format "¤#,##0.00;(¤#,##0.00)"', function() {
      var ret: NumberPattern = parsePattern('¤#,##0.00;(¤#,##0.00)');
      expect(ret.pattern).to.equal('¤#,##0.00;(¤#,##0.00)');

      expect(ret.pPrefix).to.equal('¤');
      expect(ret.pSuffix).to.be.empty;
      expect(ret.nPrefix).to.equal('(¤');
      expect(ret.nSuffix).to.equal(')');

      expect(ret.grouping.primary).to.equal(3);
      expect(ret.grouping.secondary).to.equal(3);

      expect(ret.intPrec.min).to.equal(1);
      expect(ret.intPrec.max).to.equal(4);
      expect(ret.fracPrec.min).to.equal(2);
      expect(ret.fracPrec.max).to.equal(2);

      should().equal(ret.expPrec, undefined);
      expect(ret.expPlus).to.be.false;
    });
  });
});
