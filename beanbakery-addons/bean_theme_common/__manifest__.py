# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

{
    'name': ' Bean Bakery Theme Common',
    'description': ' Bean Bakery Theme Common',
    'category': 'eCommerce',
    'version': '15.0.0.0.1',
    'depends': [
        'sale_product_configurator',
        'website_sale_comparison',
        'website_sale_wishlist',
        'website_sale_stock',
    ],

    'license': "LGPL-3",
    'author': 'Jean',
    'company': 'Bean Bakery',
    'maintainer': 'Jean',
    'website': 'https://www.beanbakery.vn',

    'data': [
        'security/ir.model.access.csv',
        'data/groups.xml',
        'views/templates.xml',
        'views/dr_config_templates.xml',

        # Backend
        'views/backend/menu_label.xml',
        'views/backend/website_menu.xml',
        'views/backend/product_label.xml',
        'views/backend/product_tags.xml',
        'views/backend/product_template.xml',
        'views/backend/product_attribute.xml',
        'views/backend/product_brand.xml',
        'views/backend/dr_website_content.xml',
        'views/backend/product_pricelist.xml',
        'views/backend/pwa_shortcuts.xml',
        'views/backend/res_config_settings.xml',
        'views/backend/dr_config.xml',
        'views/backend/category_label.xml',
        'views/backend/product_category.xml',

        # Snippets
        'views/snippets/s_mega_menu.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            '/bean_theme_common/static/src/scss/variants.scss',
        ],
        'web.assets_backend': [
            '/bean_theme_common/static/src/scss/variants.scss',
            '/bean_theme_common/static/src/js/backend/res_config_settings.js',
        ],
    },
}
