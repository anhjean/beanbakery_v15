from dateutil.relativedelta import relativedelta
import datetime

from odoo import api, fields, models


class SaleOrderDashboard(models.Model):
    _inherit = "sale.order"

    @api.model
    def retrieve_quotes(self):
        """ This function returns the values to populate the custom dashboard in
            the sale order views.
        """
        self.check_access_rights('read')

        result = {
            'all_to_send': 0,
            'all_waiting': 0,
            'all_late': 0,
            'my_to_send': 0,
            'my_waiting': 0,
            'my_late': 0,
            'all_avg_order_value': 0,
            'all_avg_days_to_sale': 0,
            'all_total_last_7_days': 0,
            'all_sent_quotes': 0,
            'company_currency_symbol': self.env.company.currency_id.symbol
        }

        one_week_ago = fields.Datetime.to_string(fields.Datetime.now() - relativedelta(days=7))

        query = """SELECT COUNT(1)
                       FROM mail_tracking_value v
                       LEFT JOIN mail_message m ON (v.mail_message_id = m.id)
                       JOIN sale_order so ON (so.id = m.res_id)
                       WHERE m.create_date >= %s
                         AND m.model = 'sale.order'
                         AND m.message_type = 'notification'
                         AND v.old_value_char = 'Quotation'
                         AND v.new_value_char = 'Quotation Sent'
                         AND so.company_id = %s;
                    """

        self.env.cr.execute(query, (one_week_ago, self.env.company.id))
        res = self.env.cr.fetchone()
        result['all_sent_quotes'] = res[0] or 0

        # easy counts
        so = self.env['sale.order']
        result['all_to_send'] = so.search_count([('state', '=', 'draft')])
        result['my_to_send'] = so.search_count([('state', '=', 'draft'), ('user_id', '=', self.env.uid)])
        result['all_waiting'] = so.search_count([('state', '=', 'sent'), ('date_order', '>=', fields.Datetime.now())])
        result['my_waiting'] = so.search_count(
            [('state', '=', 'sent'), ('date_order', '>=', fields.Datetime.now()), ('user_id', '=', self.env.uid)])
        result['all_late'] = so.search_count(
            [('state', 'in', ['draft', 'sent', 'to approve']), ('date_order', '<', fields.Datetime.now())])
        result['my_late'] = so.search_count(
            [('state', 'in', ['draft', 'sent', 'to approve']), ('date_order', '<', fields.Datetime.now()),
             ('user_id', '=', self.env.uid)])

        query = """SELECT AVG(COALESCE(so.amount_total / NULLIF(so.currency_rate, 0), so.amount_total)),
                              AVG(extract(epoch from age(so.date_order,so.create_date)/(24*60*60)::decimal(16,2))),
                              SUM(CASE WHEN so.date_order >= %s THEN COALESCE(so.amount_total / NULLIF(so.currency_rate, 0), so.amount_total) ELSE 0 END),
                              MIN(curr.decimal_places)
                       FROM sale_order so
                       JOIN res_company comp ON (so.company_id = comp.id)
                       JOIN res_currency curr ON (comp.currency_id = curr.id)
                       WHERE so.state in ('sale', 'done')
                         AND so.company_id = %s
                    """
        self._cr.execute(query, (one_week_ago, self.env.company.id))
        res = self.env.cr.fetchone()
        result['all_avg_order_value'] = round(res[0] or 0, res[3])
        result['all_avg_days_to_sale'] = round(res[1] or 0, 2)
        result['all_total_last_7_days'] = round(res[2] or 0, res[3])

        return result

    @api.model
    def sale_action_dashboard_draft_list(self):
        return self.search([])._action_view_quotes(period=False, only_my_closed=False)

    @api.model
    def sale_action_dashboard_draft_my_list(self):
        return self.search([])._action_view_quotes(period=False, only_my_closed=True)

    @api.model
    def sale_action_dashboard_waiting_list(self):
        return self.search([])._action_view_quotes(period='waiting', only_my_closed=False)

    @api.model
    def sale_action_dashboard_waiting_my_list(self):
        return self.search([])._action_view_quotes(period='waiting', only_my_closed=True)

    @api.model
    def sale_action_dashboard_late_list(self):
        return self.search([])._action_view_quotes(period='late', only_my_closed=False)

    @api.model
    def sale_action_dashboard_late_my_list(self):
        return self.search([])._action_view_quotes(period='late', only_my_closed=True)

    def _action_view_quotes(self, period=False, only_my_closed=False):
        domain = [('company_id', '=', self.env.company.id)]

        if period == 'today':
            domain += [('state', '=', 'draft'), ('date_order', '>=', fields.Datetime.to_string(datetime.date.today()))]

        if period == 'waiting':
            domain += [('state', '=', 'sent'), ('date_order', '>=', fields.Datetime.now())]

        if period == 'late':
            domain += [('state', 'in', ['draft', 'sent', 'to approve']), ('date_order', '<', fields.Datetime.now())]

        if only_my_closed and not period:
            domain += [('state', '=', 'draft'), ('user_id', '=', self._uid)]

        if only_my_closed and period:
            domain += [('user_id', '=', self._uid)]

        if not period and not only_my_closed:
            domain += [('state', '=', 'draft')]

        action = self.env['ir.actions.actions']._for_xml_id('sale.action_orders')
        action['domain'] = domain
        return action
