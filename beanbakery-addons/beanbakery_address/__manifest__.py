# -*- coding: utf-8 -*-
{
    'name': "Beanus VN Address",

    'summary': """
        This is the VN address module for Bean Bakery Biz
            """,

    'description': """
        This is the VN address module for Bean Bakery Biz. 
    """,

    'author': "Beanus",
    'website': "https://www.thebeanus.com",
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
}
