# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

from odoo import api, models


class BeanTheme(models.AbstractModel):
    _inherit = 'theme.utils'

    @api.model
    def _reset_default_config(self):

        self.disable_view('bean_theme.template_header_style_1')
        self.disable_view('bean_theme.template_header_style_2')
        self.disable_view('bean_theme.template_header_style_3')
        self.disable_view('bean_theme.template_header_style_4')
        self.disable_view('bean_theme.template_header_style_5')
        self.disable_view('bean_theme.template_header_style_6')
        self.disable_view('bean_theme.template_header_style_7')
        self.disable_view('bean_theme.template_header_style_8')

        self.disable_view('bean_theme.template_footer_style_1')
        self.disable_view('bean_theme.template_footer_style_2')
        self.disable_view('bean_theme.template_footer_style_3')
        self.disable_view('bean_theme.template_footer_style_4')
        self.disable_view('bean_theme.template_footer_style_5')
        self.disable_view('bean_theme.template_footer_style_6')
        self.disable_view('bean_theme.template_footer_style_7')
        self.disable_view('bean_theme.template_footer_style_8')
        self.disable_view('bean_theme.template_footer_style_9')
        self.disable_view('bean_theme.template_footer_style_10')

        super(BeanTheme, self)._reset_default_config()
