/** @odoo-module alias=bean_theme.dialog_snippet_configurator */
import { registry } from '@web/core/registry';
import { _t } from 'web.core';
import { Dialog } from 'web_editor.widget';

let ConfigDialog =  Dialog.extend({

    template: 'bean_theme.snippet_configurator_dialog',

    xmlDependencies: Dialog.prototype.xmlDependencies.concat(['/bean_theme/static/src/xml/editor/dialogs/snippet_configurator_dialog.xml']),
    custom_events: _.extend({}, Dialog.prototype.custom_events, {
        tp_confirm_changes: '_onComponentConfirmChanges',
    }),

    /**
     * @constructor
     */
    init: function (parent, options) {
        this._super(parent, _.extend({
            buttons: [
                { text: _t('Save'), classes: 'btn-primary ', close: true, click: this._onSaveDialog.bind(this)},
                { text: _t('Discard'), close: true },
            ],
            size: options.size || 'extra-large',
            technical: false,
            renderHeader: false,
            dialogClass: 'tp-snippet-config-dialog'
        } || {}));
        this.components = options.components;
        this.defaultValue = options.defaultValue;
    },
    /**
     * @override
     * @returns {Promise}
     */
    start: function () {
        this.$modal.addClass('BeanBakery_technical_modal');
        this._appendWidgets();
        this.$modal.find('.modal-dialog').addClass('modal-dialog-centered visible o_animate o_anim_zoom_in');
        this.$footer.find('.btn').addClass('shadow-sm text-uppercase tp-rounded-border mx-1');
        return this._super.apply(this, arguments);
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _appendWidgets: function () {
        let BodyComponent = registry.category("bean_theme_components").get('BodyComponent');
        this.BodyComponent  = new BodyComponent(this, { fieldName: 'BodyComponent', defaultValue: this.defaultValue, components: this.components });
        this.BodyComponent.appendTo(this.$el);
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _onSaveDialog: function () {
        this.trigger_up('tp_dialog_closed', this.BodyComponent.ComponentCurrentState());
        this.close();
    },
    /**
     * @private
     */
    _onComponentConfirmChanges: function (ev) {
        this.$footer.find('.btn').prop('disabled', ev.data.fieldName === 'UiComponent');
    },
});

export default ConfigDialog;