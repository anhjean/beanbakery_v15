# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

from odoo import api, fields, models
from odoo.tools.translate import html_translate


class DrWebsiteContent(models.Model):
    _name = 'dr.website.content'
    _description = 'Website Content'
    _order = 'sequence,id'

    sequence = fields.Integer(string='Sequence')
    name = fields.Char(string='Name', required=True, translate=True)
    description = fields.Char(string='Description', translate=True)
    icon = fields.Char(default='list')
    content = fields.Html(sanitize_attributes=False, translate=html_translate, sanitize_form=False)
    content_type = fields.Selection([('tab', 'Product Tab'), ('offer_popup', 'Offer Popup'), ('attribute_popup', 'Attribute Popup')], default='tab', required=True, string='Type')

    dr_tab_products_ids = fields.Many2many('product.template', 'product_template_tab_rel', 'tab_id', 'product_template_id')
    dr_offer_products_ids = fields.Many2many('product.template', 'product_template_offer_rel', 'offer_id', 'product_template_id')

    def open_design_page(self):
        self.ensure_one()
        return {
            'type': 'ir.actions.act_url',
            'target': 'new',
            'url': '/bean_theme_common/design_content/%s?enable_editor=1' % (self.id),
        }
