# About BeanBakery v15 project

This project is build on the Odoo v15 Community which customized to match the requirment for Online/ Offline Store.

## Requirements
I use this project for my own bakery business with the following requirements:
- ***My business need a website for customer to purchase our product***
- ***My business need a frontend page for my staff make order on the offline store***
- ***My business have manufactoring processes, Inventory processes and Accounting, so I need a tool to management these processes***


# Set up

In this project, I can install odoo v15 with 2 ways: **Non-docker** and **Docker**
the Database default pass is: "P@assword#@!321"

## Docker setup
- Just install Docker and docker-compose on your VPS
- Run `docker-compose up -d` on the root of project
- Then setup the nginx proxy as mentioned below.

## Non-docker setup
1. Install Python 3.7 and nodejs 
- **For CentOS** 
    - `sudo dnf install python3 python3-dev libxml2-dev libxslt1-dev libldap2-dev libsasl2-dev libtiff5-dev libjpeg8-dev libopenjp2-7-dev zlib1g-dev libfreetype6-dev liblcms2-dev libwebp-dev libharfbuzz-dev libfribidi-dev libxcb1-dev libpq-dev libxslt-devel bzip2-devel openldap-devel git curl unzip -y `
    - `sudo dnf install https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/0.12.5/wkhtmltox-0.12.5-1.centos8.x86_64.rpm `

    - Install **nodejs** and : 
      - `sudo npm install -g rtlcss` 
- **For Ubuntu** 
    - `sudo apt install python3-dev libxml2-dev libxslt1-dev libldap2-dev libsasl2-dev libtiff5-dev libjpeg8-dev libopenjp2-7-dev zlib1g-dev libfreetype6-dev liblcms2-dev libwebp-dev libharfbuzz-dev libfribidi-dev libxcb1-dev libpq-dev`
    - `sudo apt install https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/0.12.5/wkhtmltox-0.12.5-1.centos8.x86_64.rpm` 
    -  Install **nodejs** and : 
      - `sudo npm install -g rtlcss`

2. Install PostgresSQL
- **For CentOS** 
    - `dnf install postgresql postgresql-server postgresql-contrib -y`
    - `postgresql-setup initdb`
    - `systemctl start postgresql`
    - `systemctl enable postgresql`
    - *Create Postgres user:* 
      - `su - postgres -c "createuser -s beanbakery"`
- **For CentOS** 
    - *Create the file repository configuration:*
      - `sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' `
    - *Import the repository signing key:*
      - ```wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add - ```
    - *Update the package lists:*
      - `sudo apt-get update`
    - *Install the latest version of PostgreSQL.If you want a specific version, use 'postgresql-12' or similar instead of 'postgresql':*
      - `sudo apt-get -y install postgresql`

3. Clone source code and we need to create a new system user for our Odoo installation. Make sure the username is the same as the PostgreSQL user we created in the previous step (username maybe different if you want it):
    - `useradd -m -U -r -d /home/beanbakery -s /bin/bash beanbakery`
    - `sudo su - beanbakery`
    - `git clone https://github.com/Anhjean/beanbakery_v15.git ./beanbakery_app`

4. Install python dev by Virtual Env and setup Bean Bakery ERP
    - *install env lib: *
      - `pip install virtualenv`
      - `cd ~/beanbakery_app && python3 -m venv beanbakery-venv`
      - `source beanbakery-venv/bin/activate`
    - *install odoo dependencies lib: *  
      - `pip3 install setuptools wheel`
      - `pip3 install -r ./requirements.txt`

5. Make odoo public folder and system user
    - `mkdir ~/local_data && mkdir ~/local_data/log && mkdir ~/local_data/share`
    - `sudo chmod 777 ~/local_data/share -R`
    
6. Running Bean Bakery ERP
    - sudo cp ~/beanbakery_app/beanbakery.service /etc/systemd/system
    - *To start service:*
      - `sudo systemctl start beanbakery.service`
    - *To stop service:*
      - `sudo systemctl stop beanbakery.service`
    - *To check service status:*
      - `sudo systemctl status beanbakery.service`  
    
## Nginx setup
- **For Centos:**
  - dnf install nginx -y
- **For Ubuntu:**
  - apt install nginx -y
- **Create nginx default with SSL config file**
  - `sudo nano /etc/nginx/conf.d/beanbakery.conf`
  - add following code:
    ```
    #odoo server
    upstream odoo {
      server 127.0.0.1:8069;
    }
    upstream odoochat {
      server 127.0.0.1:8072;
    }

    # http -> https
    server {
      listen 80;
      server_name yourdomain.name;
      rewrite ^(.*) https://$host$1 permanent;
    }

    server {
      listen 443 ssl;
      server_name yourdomain.name;
      proxy_read_timeout 720s;
      proxy_connect_timeout 720s;
      proxy_send_timeout 720s;

      # Add Headers for odoo proxy mode
      proxy_set_header X-Forwarded-Host $host;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header X-Real-IP $remote_addr;

      # SSL parameters
      ssl_certificate /etc/ssl/nginx/server.crt;
      ssl_certificate_key /etc/ssl/nginx/server.key;
      ssl_session_timeout 30m;
      ssl_protocols TLSv1.2;
      ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
      ssl_prefer_server_ciphers off;

      # log
      access_log /var/log/nginx/odoo.access.log;
      error_log /var/log/nginx/odoo.error.log;

      # Redirect longpoll requests to odoo longpolling port
      location /longpolling {
        proxy_pass http://odoochat;
      }

      # Redirect requests to odoo backend server
      location / {
        proxy_redirect off;
        proxy_pass http://odoo;
      }

      # common gzip
      gzip_types text/css text/scss text/plain text/xml application/xml application/json application/javascript;
      gzip on;
    }
    ```
## Note
- If you want to change the DB password, edit the "odoo_pg_pass" file
- All the odoo's custom module should put in the "beanbakery-addons" folder.
- The odoo config file is in the "~/local_data/config" folder ***(docker setup)*** and in the "~/beanbakery_app/" folder ***(non-docker setup)***
- All of the odoo running data are in the "~/local_data/share" folder ***(docker setup)***
- All of the odoo databasse data are in the "~/local_data/db" folder ***(docker setup)***
- All of the odoo databasse log are in the "~/local_data/log" folder 
- For production, need a security solution for "~/local_data" folder
- **For SSL key**, should buy SSL key from ssls.com (about $7 for 1 years and $16 for 5 years per domain, link: https://www.ssls.com/ssl-certificates/comodo-positivessl).
- **For email server**, should use Google Gsuite (about $6/month/account)
- **For VPS**, should a "2 core,4GB Ram" VPS (about $20/month - ex: AWS lightsail)