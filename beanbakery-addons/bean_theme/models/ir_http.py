# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

from odoo import models


class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    @classmethod
    def _get_translation_frontend_modules_name(cls):
        mods = super(IrHttp, cls)._get_translation_frontend_modules_name()
        return mods + ['bean_theme_common', 'bean_theme']
