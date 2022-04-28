# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

{
    'name': 'Bean Bakery Theme',
    'description': 'Bean Bakery Theme',
    'summary': 'Bean Bakery Theme',
    'category': 'Theme/eCommerce',
    'version': '15.0.0.0.1',
    'depends': ['bean_theme_common'],

    'license': "LGPL-3",
    'author': 'Jean',
    'company': 'Bean Bakery',
    'maintainer': 'Jean',
    'website': 'https://www.beanbakery.vn',

    'images': [
        'static/description/bean_cover.png',
        'static/description/bean_screenshot.gif',
    ],
    'data': [
        'data/theme.ir.attachment.csv',

        'views/templates.xml',
        'views/components.xml',
        'views/layout.xml',
        'views/pages.xml',
        'views/snippets.xml',
        'views/svg_images.xml',

        # Headers / Footers
        'views/headers.xml',
        'views/preheaders.xml',
        'views/footers.xml',

        # Snippets
        'views/snippets/dynamic_snippets.xml',
        'views/snippets/s_banner.xml',
        'views/snippets/s_blog.xml',
        'views/snippets/s_clients.xml',
        'views/snippets/s_coming_soon.xml',
        'views/snippets/s_countdown.xml',
        'views/snippets/s_cover.xml',
        'views/snippets/s_cta.xml',
        'views/snippets/s_gallery.xml',
        'views/snippets/s_heading.xml',
        'views/snippets/s_icon_block.xml',
        'views/snippets/s_info_block.xml',
        'views/snippets/s_pricing.xml',
        'views/snippets/s_shop_offer.xml',
        'views/snippets/s_stats.xml',
        'views/snippets/s_subscribe.xml',
        'views/snippets/s_team.xml',
        'views/snippets/s_testimonial.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            # Libraries
            'bean_theme/static/lib/OwlCarousel2-2.3.4/assets/owl.carousel.css',
            'bean_theme/static/lib/OwlCarousel2-2.3.4/assets/owl.theme.default.css',
            # Frontend
            'bean_theme/static/src/js/website.js',
            'bean_theme/static/src/js/website_sale.js',
            'bean_theme/static/src/js/website_sale_wishlist.js',
            'bean_theme/static/src/js/sidebar.js',
            'bean_theme/static/src/js/suggested_product_slider.js',
            'bean_theme/static/src/js/service_worker_register.js',
            'bean_theme/static/src/js/core/mixins.js',
            'bean_theme/static/src/js/frontend/comparison.js',
            'bean_theme/static/src/js/frontend/quick_view_dialog.js',
            'bean_theme/static/src/js/frontend/ajax_load_products.js',
            'bean_theme/static/src/js/frontend/bottombar.js',

            'bean_theme/static/src/scss/theme.scss',
            'bean_theme/static/src/scss/rtl.scss',
            'bean_theme/static/src/scss/website.scss',
            'bean_theme/static/src/scss/website_sale.scss',
            'bean_theme/static/src/scss/sliders.scss',
            'bean_theme/static/src/scss/icon-packs/website.scss',
            'bean_theme/static/src/scss/utils.scss',
            'bean_theme/static/src/scss/snippets/cards.scss',
            'bean_theme/static/src/scss/front_end/quick_view.scss',
            'bean_theme/static/src/scss/front_end/dynamic_snippets.scss',
            'bean_theme/static/src/scss/front_end/category_filters.scss',
            'bean_theme/static/src/scss/front_end/image_hotspot.scss',
            'bean_theme/static/src/scss/snippets/2_col_deal.scss',
            'bean_theme/static/src/scss/snippets/image_products.scss',
            'bean_theme/static/src/scss/front_end/bottom_bar.scss',
            # Core
            'bean_theme/static/src/js/core/snippet_root_widget.js',
            'bean_theme/static/src/js/core/product_root_widget.js',
            'bean_theme/static/src/js/core/cart_manager.js',
            'bean_theme/static/src/js/core/cart_confirmation_dialog.js',
            # Snippets
            'bean_theme/static/src/js/frontend/dynamic_snippets.js',
            # Editor
            ('replace', 'web_editor/static/src/scss/web_editor.frontend.scss', 'bean_theme/static/src/scss/web_editor.frontend.scss'),

            # Search
            'bean_theme/static/src/js/frontend/search.js',
        ],
        'web._assets_primary_variables': [
            'bean_theme/static/src/scss/primary_variables.scss',
            'bean_theme/static/src/scss/mixins.scss',
        ],
        'web._assets_frontend_helpers': [
            'bean_theme/static/src/scss/bootstrap_overridden.scss',
        ],
        'website.assets_wysiwyg': [
            'bean_theme/static/src/js/editor/snippets.editor.js',
            'bean_theme/static/src/scss/editor/editor.scss',
            'bean_theme/static/src/scss/editor/dialogs/dialog_snippet_configurator.scss',
            'bean_theme/static/src/scss/components/components.scss',
        ],
        'website.assets_editor': [
            'bean_theme/static/src/js/core/theme_config.js',
            'bean_theme/static/src/js/editor/snippet.options.js',
            # Widgets
            'bean_theme/static/src/js/editor/components/abstract_component.js',
            'bean_theme/static/src/js/editor/components/product_selection_component.js',
            'bean_theme/static/src/js/editor/components/dropdown_component.js',
            'bean_theme/static/src/js/editor/components/selection_component.js',
            'bean_theme/static/src/js/editor/components/body_component.js',
            'bean_theme/static/src/js/editor/components/ui_component.js',
            'bean_theme/static/src/js/editor/components/range_component.js',
            'bean_theme/static/src/js/editor/components/boolean_component.js',
            'bean_theme/static/src/js/editor/components/domain_component.js',
            'bean_theme/static/src/js/editor/registries.js',
            'bean_theme/static/src/js/editor/dialogs/dialog_snippet_configurator.js',
        ],
    },
}
