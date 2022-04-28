# -*- coding: utf-8 -*-
# Copyright (c) 2019-Present Bean Bakery)

import json
import base64
import io
from functools import partial

from odoo import http
from odoo.http import request

from odoo.modules.module import get_resource_path
from odoo.tools.mimetypes import guess_mimetype


class BeanThemePWA(http.Controller):

    @http.route('/pwa/<int:website_id>/manifest.json', type='http', auth='public', website=True)
    def get_pwa_manifest(self, website_id, **kargs):
        manifest_data = {"fake": 1}
        website = request.website
        if website and website.id == website_id and website.dr_pwa_activated:
            manifest_data = {
                "name": website.dr_pwa_name,
                "short_name": website.dr_pwa_short_name,
                "display": "standalone",
                "background_color": website.dr_pwa_background_color,
                "theme_color": website.dr_pwa_theme_color,
                "start_url": website.dr_pwa_start_url,
                "scope": "/",
                "icons": [{
                    "src": "/web/image/website/%s/dr_pwa_icon_192/192x192" % website.id,
                    "sizes": "192x192",
                    "type": "image/png",
                }, {
                    "src": "/web/image/website/%s/dr_pwa_icon_512/512x512" % website.id,
                    "sizes": "512x512",
                    "type": "image/png",
                }]
            }
            if website.dr_pwa_shortcuts:
                manifest_data['shortcuts'] = [{
                    "name": shortcut.name,
                    "short_name": shortcut.short_name or '',
                    "description": shortcut.description or '',
                    "url": shortcut.url,
                    "icons": [{"src": "/web/image/dr.pwa.shortcuts/%s/icon/192x192" % shortcut.id, "sizes": "192x192"}]
                } for shortcut in website.dr_pwa_shortcuts]
        return request.make_response(
            data=json.dumps(manifest_data),
            headers=[('Content-Type', 'application/json')]
        )

    @http.route('/service_worker.js', type='http', auth='public', website=True, sitemap=False)
    def get_pwa_service_worker(self, **kargs):
        website = request.website
        js_folder = partial(get_resource_path, 'bean_theme', 'static', 'src', 'js')
        file_path = js_folder('service_worker.js')
        offline_bool = 'true' if website.dr_pwa_offline_page else 'false'
        data = open(file_path).read()
        data = data.replace('"##1##"', str(website.dr_pwa_version))
        data = data.replace('"##2##"', offline_bool)

        return request.make_response(
            data=data,
            headers=[('Content-Type', 'text/javascript')]
        )

    @http.route('/pwa/offline_page', type='http', auth='public', website=True, cors='*', sitemap=False)
    def get_pwa_offline_page(self, **kargs):
        return request.render('bean_theme.pwa_offline_page', {})

    @http.route('/pwa/logo.png', type='http', auth='public', website=True, cors='*', sitemap=False)
    def get_pwa_logo(self, **kargs):
        website = request.website
        imgname = 'logo'
        imgext = '.png'
        placeholder = partial(get_resource_path, 'web', 'static', 'src', 'img')

        if not website.logo:
            response = http.send_file(placeholder('nologo.png'))
        else:
            b64 = website.logo
            image_base64 = base64.b64decode(b64)
            image_data = io.BytesIO(image_base64)
            mimetype = guess_mimetype(image_base64, default='image/png')
            imgext = '.' + mimetype.split('/')[1]
            if imgext == '.svg+xml':
                imgext = '.svg'
            response = http.send_file(image_data, filename=imgname + imgext, mimetype=mimetype, mtime=website.write_date)
        return response

    @http.route('/pwa/is_pwa_actived', type='http', auth='public', website=True, sitemap=False)
    def get_pwa_is_actived(self, **kargs):
        data = {'pwa': request.website.dr_pwa_activated}
        return request.make_response(
            data=json.dumps(data),
            headers=[('Content-Type', 'application/json')]
        )
