# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

from odoo import api, fields, models


class DrProductTags(models.Model):
    _name = 'dr.product.tags'
    _inherit = ['website.multi.mixin']
    _description = 'Product Tags'

    name = fields.Char(required=True, translate=True)
    product_ids = fields.Many2many('product.template', 'dr_product_tags_rel', 'tag_id', 'product_id')
    product_count = fields.Integer(compute='_compute_product_count')
    active = fields.Boolean(default=True)
    # To remove in v16
    dr_tab_ids = fields.One2many('dr.product.tabs', 'tag_id', string='Tabs', help='Display in product detail page on website.')
    dr_offer_ids = fields.One2many('dr.product.offer', 'tag_id', string='Offers', help='Display in product detail page on website.')

    def _compute_product_count(self):
        for tag in self:
            tag.product_count = len(tag.product_ids)

    def action_open_products(self):
        self.ensure_one()
        action = self.env.ref('website_sale.product_template_action_website').read()[0]
        action['domain'] = [('dr_tag_ids', 'in', self.id)]
        return action
