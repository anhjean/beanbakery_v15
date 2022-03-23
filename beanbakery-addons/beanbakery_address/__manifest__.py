# -*- coding: utf-8 -*-
{
    'name': "Beanbakery VN Address",

    'summary': """
        Short (1 phrase/line) summary of the module's purpose, used as
        subtitle on modules listing or apps.openerp.com""",

    'description': """
        Long description of module's purpose
    """,

    'author': "Bean Bakery",
    'website': "https://www.beanbakery.vn",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/14.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Application',
    'version': '0.1',
    "license": "LGPL-3",
    "application": True,
    "installable": True,
    "images": ["static/description/icon.png"],

    # any module necessary for this one to work correctly
    'depends': ['base'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/res_partner.xml',
        'views/res_city_view.xml',
        'views/res_country_view.xml',
        'views/res_company_info.xml',
        'data/res.city.csv',
        'data/res.country.district.csv',
        'data/res.country.ward.csv'
    ],
     'web.assets_qweb': [
            'bean_bakery_module/static/src/xml/**/*',
        ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
}
