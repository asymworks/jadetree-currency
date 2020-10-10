import { expect, should } from 'chai';
import { Locale, LocaleData } from '../src/locale';

describe('Locale Data', function() {
  describe('Inheritance', function() {
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
  });
});
