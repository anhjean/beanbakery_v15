odoo.define('ob_sale_dashboard.dashboard', function (require) {
"use strict";


/**
 * This file defines the Sale Dashboard view (alongside its renderer, model
 * and controller). This Dashboard is added to the top of list and kanban Sale
 * views, it extends both views with essentially the same code except for
 * _onDashboardActionClicked function so we can apply filters without changing our
 * current view.
 */

var core = require('web.core');
var ListController = require('web.ListController');
var ListModel = require('web.ListModel');
var ListRenderer = require('web.ListRenderer');
var ListView = require('web.ListView');
var SampleServer = require('web.SampleServer');
var view_registry = require('web.view_registry');

var QWeb = core.qweb;

// Add mock of method 'retrieve_quotes' in SampleServer, so that we can have
// the sample data in empty Sale kanban and list view
let dashboardValues;
SampleServer.mockRegistry.add('sale.order/retrieve_quotes', () => {
    return Object.assign({}, dashboardValues);
});


//--------------------------------------------------------------------------
// List View
//--------------------------------------------------------------------------

var SaleListDashboardRenderer = ListRenderer.extend({
    events:_.extend({}, ListRenderer.prototype.events, {
        'click .o_dashboard_action': '_onDashboardActionClicked',
    }),
    /**
     * @override
     * @private
     * @returns {Promise}
     */
    _renderView: function () {
        var self = this;
        return this._super.apply(this, arguments).then(function () {
            var values = self.state.dashboardValues;
            var sale_dashboard = QWeb.render('sale_dashboard.SaleDashboard', {
                values: values,
            });
            self.$el.prepend(sale_dashboard);
        });
    },

    /**
     * @private
     * @param {MouseEvent}
     */
    _onDashboardActionClicked: function (e) {
        e.preventDefault();
        var $action = $(e.currentTarget);
        this.trigger_up('dashboard_open_action', {
            action_name: $action.attr('name')+"_list",
            action_context: $action.attr('context'),
        });
    },
});

var SaleListDashboardModel = ListModel.extend({
    /**
     * @override
     */
    init: function () {
        this.dashboardValues = {};
        this._super.apply(this, arguments);
    },

    /**
     * @override
     */
    __get: function (localID) {
        var result = this._super.apply(this, arguments);
        if (_.isObject(result)) {
            result.dashboardValues = this.dashboardValues[localID];
        }
        return result;
    },
    /**
     * @override
     * @returns {Promise}
     */
    __load: function () {
        return this._loadDashboard(this._super.apply(this, arguments));
    },
    /**
     * @override
     * @returns {Promise}
     */
    __reload: function () {
        return this._loadDashboard(this._super.apply(this, arguments));
    },

    /**
     * @private
     * @param {Promise} super_def a promise that resolves with a dataPoint id
     * @returns {Promise -> string} resolves to the dataPoint id
     */
    _loadDashboard: function (super_def) {
        var self = this;
        var dashboard_def = this._rpc({
            model: 'sale.order',
            method: 'retrieve_quotes',
        });
        return Promise.all([super_def, dashboard_def]).then(function(results) {
            var id = results[0];
            dashboardValues = results[1];
            self.dashboardValues[id] = dashboardValues;
            return id;
        });
    },
});

var SaleListDashboardController = ListController.extend({
    custom_events: _.extend({}, ListController.prototype.custom_events, {
        dashboard_open_action: '_onDashboardOpenAction',
    }),

    /**
     * @private
     * @param {OdooEvent} e
     */
    _onDashboardOpenAction: function (e) {
        var self = this;
        var action_name = e.data.action_name;
        if (_.contains(['sale_action_dashboard_draft_list', 'sale_action_dashboard_draft_my_list',
            'sale_action_dashboard_waiting_list', 'sale_action_dashboard_waiting_my_list',
             'sale_action_dashboard_late_list', 'sale_action_dashboard_late_my_list'], action_name)) {
            return this._rpc({model: this.modelName, method: action_name})
                .then(function (data) {
                    if (data) {
                    return self.do_action(data);
                    }
                });
        }
        return this.do_action(action_name);
    },
});

var SaleListDashboardView = ListView.extend({
    config: _.extend({}, ListView.prototype.config, {
        Model: SaleListDashboardModel,
        Renderer: SaleListDashboardRenderer,
        Controller: SaleListDashboardController,
    }),
});

view_registry.add('sale_list_dashboard', SaleListDashboardView);

return {
    SaleListDashboardModel: SaleListDashboardModel,
    SaleListDashboardRenderer: SaleListDashboardRenderer,
    SaleListDashboardController: SaleListDashboardController,
};

});