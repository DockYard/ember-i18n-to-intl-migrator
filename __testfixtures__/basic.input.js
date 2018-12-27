import Route from '@ember/routing/route';
import { get } from '@ember/object';
import { translationMacro as t } from 'ember-i18n';

export default Route.extend({
  i18n: inject('i18n'),
  i18n: inject(),
  i18n: service(),

  random: alias('random'),


  init() {
    this.i18n.t('wat');
    this.get('i18n').t('wat');
    get(this, 'i18n').t('wat');
    get(this, 'i18n');
    let i = this.get('i18n');
    let i = get(this, 'i18n');
    let message = get(this, 'i18n').t('.selector', {});
  }
});

