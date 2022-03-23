{
    'name': "Sale Dashboard",

    'summary': """
            Sale Dashboard.""",

    'description': """ Sales Dashboard View """,

    'author': "Odoo Being, Odoo SA",
    'website': "https://www.odoobeing.com",
    'license': 'AGPL-3',
    'category': 'Sales',
    'version': '15.0.1.0.0',
    'support': 'odoobeing@gmail.com',
    'images': ['static/description/images/ob_sale_dashboard.png'],
    'installable': True,
    'auto_install': False,
    "depends": ['sale_management'],
    "data": [
        'views/sale_order.xml',
    ],
    'assets': {
        'web.assets_backend': [
            '/ob_sale_dashboard/static/src/scss/sale.scss',
            '/ob_sale_dashboard/static/src/js/sale_dashboard.js',
        ],
        'web.assets_qweb': [
            'ob_sale_dashboard/static/src/xml/**/*',
        ],
    },
}
