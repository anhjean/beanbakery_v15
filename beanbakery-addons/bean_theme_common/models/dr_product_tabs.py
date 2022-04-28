# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

from odoo import api, fields, models
from odoo.tools.translate import html_translate


# To remove in v16
class DrProductTabs(models.Model):
    _name = 'dr.product.tabs'
    _description = 'Product Tabs'
    _order = 'sequence,id'

    name = fields.Char(string='Title', required=True, translate=True)
    icon = fields.Char(default='list')
    content = fields.Html(sanitize_attributes=False, translate=html_translate, sanitize_form=False)
    sequence = fields.Integer(string='Sequence')
    product_id = fields.Many2one('product.template')
    tag_id = fields.Many2one('dr.product.tags')
