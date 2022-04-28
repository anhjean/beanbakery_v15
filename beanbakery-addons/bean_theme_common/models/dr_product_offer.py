# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

from odoo import api, fields, models
from odoo.tools.translate import html_translate


# To remove in v16
class DrProductOffer(models.Model):
    _name = 'dr.product.offer'
    _description = 'Product Offers'
    _order = 'sequence,id'

    name = fields.Char(string='Title', required=True, translate=True)
    description = fields.Char(string='Description', required=True, translate=True)
    icon = fields.Char(default='list')
    sequence = fields.Integer(string='Sequence')
    dialog_content = fields.Html(sanitize_attributes=False, translate=html_translate, sanitize_form=False)
    product_id = fields.Many2one('product.template')
    tag_id = fields.Many2one('dr.product.tags')
