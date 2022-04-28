odoo.define('bean_theme_common.settings', function (require) {

const BaseSettingController = require('base.settings').Controller;
const FormController = require('web.FormController');

BaseSettingController.include({
    _onButtonClicked: function (ev) {
        if (ev.data.attrs.name === 'dr_open_pwa_shortcuts' || ev.data.attrs.name === 'dr_open_theme_custom_modules') {
            FormController.prototype._onButtonClicked.apply(this, arguments);
        } else {
            this._super.apply(this, arguments);
        }
    },
});

});
