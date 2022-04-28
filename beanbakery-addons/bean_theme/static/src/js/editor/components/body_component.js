/** @odoo-module alias=bean_theme.body_component */
import AbstractComponent from '@bean_theme/js/editor/components/abstract_component';
import { registry } from '@web/core/registry';

let BodyComponent = AbstractComponent.extend({
    template: 'bean_theme.body_component',
    xmlDependencies: AbstractComponent.prototype.xmlDependencies.concat(['/bean_theme/static/src/xml/editor/components/body_component.xml']),
    /**
     * @constructor
     */
    init: function (parent, options) {
        this._super.apply(this, arguments);
        this.SelectionComponentValue = options.components.SelectionComponent || {};
        this.UiComponent = options.components.UiComponent || {};
        this.hasUiComponent = _.contains(_.keys(options.components), 'UiComponent');
        this.model = this.SelectionComponentValue.model || 'product.template';
        this.subModel = this.SelectionComponentValue.subModel || 'product.template';
    },
    _getDefaultFieldValue: function () {
        return {
            SelectionComponent: this.SelectionComponentValue,
            UiComponent: this.UiComponent,
        };
    },
    ComponentCurrentState: function () {
        let componentValue = {};
        _.each(this.allComponents, (component, name) => {
            componentValue[name] = this._getComponentState(name);
        });
        return componentValue;
    },
    _updatePreview: function (attr, value) {
        if (this.allComponents.UiComponent) {
            this.allComponents.UiComponent.setAttrsNode(attr, value);
            this.allComponents.UiComponent.setAttrsNode('data-ui-config-info', this.allComponents.UiComponent.ComponentCurrentState());
        }
    },
    _hideComponent: function (hideComponent, displayComponent) {
        this.$('[data-field-name=' + hideComponent+ ']').addClass('d-none');
        this.$('[data-field-name=' + displayComponent+ ']').removeClass('d-none');
    },
    _onComponentConfirmChanges: function (ev) {
        let { fieldName, value} = ev.data;
        switch (fieldName) {
            case 'SelectionComponent':
                this._updatePreview('data-selection-info', value);
                this._hideComponent(fieldName, 'UiComponent');
                break;
            case 'UiComponent':
                this._hideComponent(fieldName, 'SelectionComponent');
            break;
        }
    },
});

registry.category("bean_theme_components").add("BodyComponent", BodyComponent);
export default BodyComponent;