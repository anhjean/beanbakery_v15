# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

from odoo import api, fields, models


# To remove in v16
class DrProductBrand(models.Model):
    _name = 'dr.product.brand'
    _inherit = ['website.multi.mixin']
    _description = 'Product Brand'
    _order = 'sequence,id'

    name = fields.Char(required=True, translate=True)
    description = fields.Char(translate=True)
    image = fields.Binary()
    sequence = fields.Integer(string='Sequence')
    active = fields.Boolean(default=True)
