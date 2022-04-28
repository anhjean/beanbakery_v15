odoo.define('bean_theme.website', function (require) {
'use strict';

require('web.dom_ready');
require('website.content.menu');
const publicWidget = require('web.public.widget');
const { WebsiteRoot } = require('website.root');
const config = require('web.config');
const isMobileEnv = config.device.size_class <= config.device.SIZES.LG && config.device.touch;

// Enable bootstrap tooltip
$('[data-toggle="tooltip"]').tooltip({
    delay: {show: 100, hide: 100},
});

// Back to top button
const backToTopButtonEl = document.querySelector('.tp-back-to-top');
backToTopButtonEl.classList.add('d-none');
if (!isMobileEnv) {
    const wrapwrapEl = document.getElementById('wrapwrap');
    wrapwrapEl.addEventListener('scroll', ev => {
        if (wrapwrapEl.scrollTop > 800) {
            backToTopButtonEl.classList.remove('d-none');
        } else {
            backToTopButtonEl.classList.add('d-none');
        }
    });
    backToTopButtonEl.addEventListener('click', ev => {
        ev.preventDefault();
        wrapwrapEl.scrollTo({top: 0, behavior: 'smooth'});
    });
}

// Pricelist
WebsiteRoot.include({
    events: _.extend({}, WebsiteRoot.prototype.events || {}, {
        'click .dropdown-menu .tp-select-pricelist': '_onClickTpPricelist',
        'change .dropdown-menu .tp-select-pricelist': '_onChangeTpPricelist',
    }),
    _onClickTpPricelist: function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
    },
    _onChangeTpPricelist: function (ev) {
        const value = $(ev.currentTarget).val();
        window.location = value;
    },
});

// Used for header style - 6 (hack to apply color)
publicWidget.registry.HeaderMainCollapse.include({
    selector: 'header#top:not(.tp-no-collapse)',
});

// FIX: Affix header glitch on some devices having no footer pages(like checkout page).
publicWidget.registry.StandardAffixedHeader.include({
    _updateHeaderOnScroll: function (scroll) {
        if (!$('#wrapwrap footer').length) {
            this.destroy();
            return;
        }
        this._super(...arguments);
    }
});

publicWidget.registry.FixedHeader.include({
    _updateHeaderOnScroll: function (scroll) {
        if (!$('#wrapwrap footer').length) {
            this.destroy();
            return;
        }
        this._super(...arguments);
    }
});

});
